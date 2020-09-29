
'use strict';

const chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,
  publishUrl = require('./publish-url');

chai.use(sinonChai);

describe('publish-url', ()=> {
  beforeEach(sinon.restore);
  async function setup_publishUrl() {
    const  { _internals: __, getStaticPageSlugUrl } = publishUrl,
      component = {
        content:
        [ { _ref:
              'clay.radio.com/_components/paragraph/instances/ckdhg4twf000827pdhamij4d1' } ],
        headline: 'A valid head line edited',
        slugLock: true,
        slug: 'valid_slug',
        date: 'datexyz',
        pageTitle: 'A valid head line' },
      locals = {
        site: {
          proto: 'https',
          prefix: ''
        },
        date: 'asdf'
      },
      mainComponentRefs =  ['/_components/static-page/instances'],
      pageData = {
        main: [ 'clay.radio.com/_components/static-page/instances/ckdhg4twf000927pdoyxyyfo2' ]
      },
      pageDataStation = {
        main: [ 'clay.radio.com/_components/static-page/instances/ckdhg4twf000927pdoyxyyfo2' ]
      },
      pageType = 'static-page',
      stationComponent = {
        content:
        [ { _ref:
              'clay.radio.com/_components/paragraph/instances/ckdj9g49a0011bjlewc1qd503' } ],
        headline: 'A valid station headline',
        pageTitle: 'A valid station headline',
        stationSlug: 'thebull',
        componentVariation: 'static-page'
      },
      stationUrlOptions = {
        prefix: 'http://clay.radio.com',
        slug: 'a-valid-station-headline',
        pageType: 'static-page',
        stationSlug: 'thebull' },
      urlOptions = {
        prefix: 'http://clay.radio.com',
        slug: 'a-valid-headline',
        pageType: 'static-page' };

    return { __, component, getStaticPageSlugUrl, locals, mainComponentRefs, pageData, pageDataStation, pageType, stationComponent, stationUrlOptions, urlOptions };
  }

  describe('getStaticPageSlugUrl',async () => {
    it('Generates an url with a slug appended for radio.com', async () => {
      const { pageData, component, urlOptions, locals, mainComponentRefs, pageType, __,  getStaticPageSlugUrl } = await setup_publishUrl();
      
      __.pubUtils.getMainComponentFromRef = sinon.stub().resolves({ component, pageType });
      __.pubUtils.getUrlOptions = sinon.stub().resolves(urlOptions);
      const result = await getStaticPageSlugUrl(pageData, locals, mainComponentRefs);

      expect(result).to.be.equal('http://clay.radio.com/a-valid-headline');
      expect(result).to.be.a('string');
    });

    it('Generates an url with a slug appended for a station', async () => {
      const { pageDataStation, stationComponent, stationUrlOptions, locals, mainComponentRefs, pageType, __,  getStaticPageSlugUrl } = await setup_publishUrl();

      __.pubUtils.getMainComponentFromRef = sinon.stub().resolves({ stationComponent, pageType });
      __.pubUtils.getUrlOptions = sinon.stub().resolves(stationUrlOptions);

      const result = await getStaticPageSlugUrl(pageDataStation, locals, mainComponentRefs);

      expect(result).to.be.equal('http://clay.radio.com/thebull/a-valid-station-headline');
      expect(result).to.be.a('string');
    });
  });
});
