'use strict';

const chai = require('chai'), { expect } = chai;

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

});
