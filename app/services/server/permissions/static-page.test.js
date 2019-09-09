'use strict';

const chai = require('chai'), { expect } = chai;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('StaticPage tests', () => {
  const staticPage = require('./static-page');

  function makeUser(hasCreatePermission) {
    const actions = {
      create: { a: component => ({ value: hasCreatePermission && component === 'static-page' }) },
      FALSE: { a: () => ({ value: false }) }
    };

    return {
      can: action => {
        return actions[action] || actions.FALSE;
      }
    };
  }

  describe('canCreateMenuItem', () => {

    it('returns a closure for currying', () => {
      const user = makeUser(true),
        canCreateStaticPageMenuItem = staticPage.canCreateMenuItem(user);

      expect(canCreateStaticPageMenuItem).to.be.a('function');
    });

    it('is true if item is static page and user has permission', () => {
      const
        item = { id: 'new-static-page' },
        user = makeUser(true),
        canCreateStaticPageMenuItem = staticPage.canCreateMenuItem(user),
        result = canCreateStaticPageMenuItem(item);

      expect(result).to.be.true;
    });

    it('is false if item is a static page and user lacks permission', () => {
      const
        item = { id: 'new-static-page' },
        user = makeUser(false),
        canCreateStaticPageMenuItem = staticPage.canCreateMenuItem(user),
        result = canCreateStaticPageMenuItem(item);

      expect(result).to.be.false;
    });

    it('is true if item is not a static page even if user lacks permission', () => {
      const
        item = { id: 'not-a-static-page' },
        user = makeUser(false),
        canCreateStaticPageMenuItem = staticPage.canCreateMenuItem(user),
        result = canCreateStaticPageMenuItem(item);

      expect(result).to.be.true;
    });
  });

  describe('isPageAStaticPage', () => {
    // generates standard proxies for required components used by isPageAStaticPage
    function requireStaticPageWithProxy({
      getMainComponentsForPageUriSpy = () => [],
      logSpy = () => {}
    }) {
      return proxyquire('./static-page', {
        '../db': { getMainComponentsForPageUri: getMainComponentsForPageUriSpy },
        '../../universal/log': { setup: () => logSpy }
      });
    }

    it('is true if main contains a static-page ref', async () => {
      const getMainComponentsForPageUriSpy = sinon.stub()
          .returns(['clay.radio.com/_components/static-page/instances/some-static-page-inst-id']),
        staticPage = requireStaticPageWithProxy({ getMainComponentsForPageUriSpy }),
        result = await staticPage.isPageAStaticPage('some-uri');

      expect(result).to.be.true;
      expect(getMainComponentsForPageUriSpy).to.be.calledOnceWith('some-uri');
    });

    it('is false if main contains no static page refs', async () => {
      const getMainComponentsForPageUriSpy = sinon.stub()
          .returns(['clay.radio.com/_components/article/instances/some-article-inst-id']),
        staticPage = requireStaticPageWithProxy({ getMainComponentsForPageUriSpy }),
        result = await staticPage.isPageAStaticPage('some-article');

      expect(result).to.be.false;
      expect(getMainComponentsForPageUriSpy).to.be.calledOnceWith('some-article');
    });

    it('logs error info when an error is thrown', async () => {
      const getMainComponentsForPageUriSpy = sinon.stub()
          .throws('Some DB Problem'),
        logSpy = sinon.spy(),
        staticPage = requireStaticPageWithProxy({ getMainComponentsForPageUriSpy, logSpy }),
        result = await staticPage.isPageAStaticPage('no-matter');

      expect(result).to.eql(null);
      expect(getMainComponentsForPageUriSpy).to.be.calledOnceWith('no-matter');
      expect(logSpy).to.be.calledOnceWith(
        'error',
        'There was an error checking if page is static for uri: no-matter');
    });
  });
});
