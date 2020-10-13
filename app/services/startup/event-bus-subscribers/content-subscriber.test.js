'use strict';
const chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai,
  contentSubscriber = require('./content-subscriber');

chai.use(sinonChai);

describe('content-subscriber', () => {
  function setup_contentSubscriber() {
    const { _internals: __ } = contentSubscriber;

    return { __, contentSubscriber };
  }

  afterEach(sinon.restore);

  // Normally we do not test internals directly, however, in this case we are adding to the existing library.
  describe('handlePublishStationSyndication', () => {
    function setup_handlePublishStationSyndication(componentName = 'article') {
      const { __ } = setup_contentSubscriber(),
        uri = 'clay.radio.com/_pages/ckbkbzf8q00001esbnw1jgd51',
        mainComponent = `clay.radio.com/_components/${componentName}/instances/ckbkbzfht000h1esbcz7magn2@published`,
        page = {
          uri: `${uri}@published`,
          data: {
            main: [ mainComponent ]
          }
        },
        contentData = {
          canonicalUrl: 'http://clay.radio.com/news/wines-vines-and-vinyls',
          stationSyndication: [
            { syndicatedArticleSlug: '/kwiq/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/1007fmthewordkkht/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/wbtspecialevent/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/jackontheweb/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/starpittsburgh/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/101thebeard/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/1011fmtheanswer/wines-vines-and-vinyls' }
          ]
        },
        allSyndicatedUrls = [
          { url: 'clay.radio.com/1009theeagle/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/wbtspecialevent/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/starpittsburgh/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/1009thewolf/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/news/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/jackontheweb/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/seattlewolf/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/101thebeard/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/thebull/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/kwiq/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/1007fmthewordkkht/wines-vines-and-vinyls' },
          { url: 'clay.radio.com/1011fmtheanswer/wines-vines-and-vinyls' }
        ],
        originalArticleId = [ { id: 'clay.radio.com/_uris/Y2xheS5yYWRpby5jb20vbmV3cy93aW5lcy12aW5lcy1hbmQtdmlueWxz' }],
        { handlePublishStationSyndication } = __;

      sinon.spy(__, 'getComponentName');
      sinon.stub(__, 'dbGet').resolves(contentData);
      sinon.stub(__, 'getCanonicalRedirect').resolves(originalArticleId);
      sinon.stub(__, 'getUri').resolves(allSyndicatedUrls);
      sinon.stub(__, 'dbPut').resolves();
      sinon.stub(__, 'setUri').resolves();
      sinon.spy(__, 'updateModifiedUrls');

      return { handlePublishStationSyndication, __, page, mainComponent, uri };
    }

    it('handles updates for articles', async () => {
      const { __, handlePublishStationSyndication, page } = setup_handlePublishStationSyndication('article');

      await handlePublishStationSyndication(page);
      expect(__.getComponentName).to.have.been.calledOnce;
      expect(__.dbGet).to.have.been.calledOnce;
    });

    it('handles updates for galleries', async () => {
      const { __, handlePublishStationSyndication, page } = setup_handlePublishStationSyndication('gallery');

      await handlePublishStationSyndication(page);
      expect(__.getComponentName).to.have.been.calledOnce;
      expect(__.dbGet).to.have.been.calledOnce;
    });

    it('does not handles updates for other components', async () => {
      const { __, handlePublishStationSyndication, page } = setup_handlePublishStationSyndication('static-page');

      await handlePublishStationSyndication(page);
      expect(__.getComponentName).to.have.been.calledOnce;
      expect(__.dbGet).not.to.have.been.called;
    });


    it('updates unsyndicated url to redirect to canonical uri', async () => {
      const { __, handlePublishStationSyndication, mainComponent, page, uri } = setup_handlePublishStationSyndication();

      await handlePublishStationSyndication(page);
      expect(__.dbGet).to.have.been.calledWith(mainComponent);
      expect(__.getUri).to.have.been.calledWith(uri);
      expect(__.getCanonicalRedirect).to.have.been.calledOnce;
      expect(__.dbPut.getCalls().length).is.eql(7);
      expect(__.updateModifiedUrls).to.have.been.calledOnce;
    });

    it('should update redirect to previous url', async () => {
      const syndicationEntries = [
          {
            source: 'manual syndication',
            callsign: 'KAMPHD2',
            stationName: 'We Are Channel Q',
            stationSlug: 'wearechannelq',
            sectionFront: 'gloc',
            syndicatedArticleSlug:
              '/wearechannelq/gloc/new-slug-prince-william-david-attenborough-launch-earthshot-award'
          }
        ],
        modifiedUrls = [
          {
            id: 'clay.radio.com/_uris/Y2xheS5yYWRpby5jb20vd2VhcmVjaGFubmVscS9nbG9jL3ByaW5jZS13aWxsaWFtLWRhdmlkLWF0dGVuYm9yb3VnaC1sYXVuY2gtZWFydGhzaG90LWF3YXJk',
            data: 'clay.radio.com/_pages/ckg0vvquv000a0yon4ma4e2d2',
            url: 'clay.radio.com/wearechannelq/gloc/slug-prince-william-david-attenborough-launch-earthshot-award'
          }
        ],
        { __ } = setup_handlePublishStationSyndication(),
        host = 'clay.radio.com',
        url = `${host}${syndicationEntries[0].syndicatedArticleSlug}`;

      await __.updateModifiedUrls(modifiedUrls, syndicationEntries, host);
      
      expect(__.updateModifiedUrls).to.have.been.calledOnce;
      expect(__.dbPut).to.have.been.calledOnce;
      expect(__.dbPut).to.have.been.calledWith(
        modifiedUrls[0].id,
        `${host}/_uris/${Buffer.from(url, 'utf8').toString('base64')}`
      );
      expect(modifiedUrls[0].id).not.to.be.equal(`${host}/_uris/${Buffer.from(url, 'utf8').toString('base64')}`);
    });
  });

});
