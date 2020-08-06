
'use strict';

const chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,
  pubUtils = require('./publish-utils'),
  publishUrl = require('./publish-url');

chai.use(sinonChai);

describe('publish-url', ()=> {
  beforeEach(sinon.restore);
  function setup_publisUrl() {
    const  pageData = {
      main: { main: [ 'clay.radio.com/_components/static-page/instances/ckdhg4twf000927pdoyxyyfo2' ] },
      mainComponentRefs: ['/_components/static-page/instances'],
      locals: {},
      mainData: {
        content:
        [ { _ref:
              'clay.radio.com/_components/paragraph/instances/ckdhg4twf000827pdhamij4d1' } ],
        sources: [],
        headline: 'A valid head line edited',
        slugLock: true,
        pageTitle: 'A valid head line' },
      pageType: 'static-page'
    };

    return { pageData };
  }

  describe('getStaticPageSlugUrl', async () => {

    const { pageData } = setup_publisUrl();
    
    it('Generates a valid url', async () => {
      const stubOptions = sinon.stub(pubUtils, 'getUrlOptions').returns('http:///a-valid-url'),
        stubComp = sinon.stub(pubUtils, 'getMainComponentFromRef')
          .resolves({ component: pageData.mainData, pageType: pageData.pageType });

      await publishUrl.getStaticPageSlugUrl(pageData, pageData.locals, pageData.mainComponentRefs);
      
      expect(stubComp).to.have.been.calledOnce;
      expect(stubOptions).to.have.been.calledOnce;
    });
  });
});
