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

    return { __, contentSubscriber }
  }

  afterEach(sinon.restore);

  // Normally we do not test internals directly, however, in this case we are adding to the existing library.
  describe('handlePublishStationSyndication', () => {
    function setup_handlePublishStationSyndication(componentName = 'article') {
      const { __, contentSubscriber } = setup_contentSubscriber(),
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
        stationSyndication:
        [ 
            { syndicatedArticleSlug: '/kwiq/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/1007fmthewordkkht/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/wbtspecialevent/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/jackontheweb/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/starpittsburgh/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/101thebeard/wines-vines-and-vinyls' },
            { syndicatedArticleSlug: '/1011fmtheanswer/wines-vines-and-vinyls' } 
        ]},
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
        { url: 'clay.radio.com/1011fmtheanswer/wines-vines-and-vinyls' } ],
    originalArticleId = [ { id: 'clay.radio.com/_uris/Y2xheS5yYWRpby5jb20vbmV3cy93aW5lcy12aW5lcy1hbmQtdmlueWxz' } ],
        { handlePublishStationSyndication } = __;

      sinon.spy(__, 'getComponentName');
      sinon.stub(__, 'dbGet').resolves(contentData);
      sinon.stub(__, 'getCanonicalRedirect').resolves(originalArticleId);
      sinon.stub(__, 'getUrls').resolves(allSyndicatedUrls);
      sinon.stub(__, 'dbPut').resolves();
      sinon.stub(__, 'setUri').resolves();

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
      expect(__.getUrls).to.have.been.calledWith(uri);
      expect(__.getCanonicalRedirect).to.have.been.calledOnce;
      expect(__.dbPut.getCalls().length).is.eql(7);
    });
  });

});



// describe('update unsyndicate station from article', () => {
//     let sandbox;
    
//     beforeEach(() => {
//       sandbox = sinon.sandbox.create();
//       sandbox.stub(db);
//     });

//     function set_syndicated_data() {
    //     const page = {
    //         uri: 'clay.radio.com/_pages/ckbkbzf8q00001esbnw1jgd51@published',
    //         data: {
    //             main: [ 'clay.radio.com/_components/article/instances/ckbkbzfht000h1esbcz7magn2@published' ]
    //         }
    //     },
    //     contentData = {
    //         canonicalUrl: 'http://clay.radio.com/news/wines-vines-and-vinyls',
    //         stationSyndication:
    //         [ 
    //             { syndicatedArticleSlug: '/kwiq/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/1007fmthewordkkht/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/wbtspecialevent/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/jackontheweb/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/starpittsburgh/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/101thebeard/wines-vines-and-vinyls' },
    //             { syndicatedArticleSlug: '/1011fmtheanswer/wines-vines-and-vinyls' } 
    //         ]},
    //     allSyndicatedUrls = [ 
    //         { url: 'clay.radio.com/1009theeagle/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/wbtspecialevent/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/starpittsburgh/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/1009thewolf/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/news/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/jackontheweb/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/seattlewolf/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/101thebeard/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/thebull/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/kwiq/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/1007fmthewordkkht/wines-vines-and-vinyls' },
    //         { url: 'clay.radio.com/1011fmtheanswer/wines-vines-and-vinyls' } ],
    //     originalArticleId = [ { id: 'clay.radio.com/_uris/Y2xheS5yYWRpby5jb20vbmV3cy93aW5lcy12aW5lcy1hbmQtdmlueWxz' } ]
    //     return {page,  contentData, allSyndicatedUrls, originalArticleId };
    // };

//     it('updates changed the uri for a redirect url', async () => {
//         const {page, contentData, allSyndicatedUrls, originalArticleId} = set_syndicated_data();
//         sandbox.stub(db, 'get').returns(contentData);
//         const urls = ['werew', 'ghjkl'];
//         result = await handlePublishStationSyndication(page);
//         console.log('this', this)
//         let stuff = 'clay.radio.com/_components/article/instances/ckbkbzfht000h1esbcz7magn2@published'
//         sandbox.stub(getComponentName).returns(s3);
//         expect(typeof urls).to.equal('object')
//     })
// });

// async function handlePublishStationSyndication(page) {
//     const mainRef = page.data.main[0],
//       host = page.uri.split('/')[0];
  
//     if (['article', 'gallery'].includes(getComponentName(mainRef))) {
//       const contentData = await db.get(mainRef),
//         canonicalInstance = new URL(contentData.canonicalUrl),
//         allSyndicatedUrls = await db.getUrls(page.uri.replace('@published', '')),
//         originalArticleId = await db.getCanonicalRedirect(`${canonicalInstance.hostname}${canonicalInstance.pathname}`),
//         redirectUri = _get(originalArticleId, '0.id'),
//         newSyndicatedUrls = (contentData.stationSyndication || []).map(station => ({ url: `${host}${station.syndicatedArticleSlug}` })),
//         outDatedUrls = _differenceWith(allSyndicatedUrls, newSyndicatedUrls, _isEqual),
//         removeCanonical = outDatedUrls.filter(({ url }) => !contentData.canonicalUrl.includes(url)),
//         queue = (contentData.stationSyndication || []).map(station => {
//           if (station.syndicatedArticleSlug) {
//             const url = `${host}${station.syndicatedArticleSlug}`,
//               redirect = page.uri.replace('@published', '');
  
//             return db.put(`${host}/_uris/${buffer.encode(url)}`, redirect);
//           }
//         }),
//         updateDeprecatedUrls = removeCanonical.map(({ url }) => {
//           return db.setUri(redirectUri, url);
//         });
  
//       await Promise.all(queue);
//       await Promise.all(updateDeprecatedUrls);
//     }
//   }