'use strict';

const
  apMedia = require('./ap-media'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('ap-media', () => {
    function setupApMedia() {
      const { _internals: __, getApArticleBody, getApFeed, saveApPicture, searchAp, importApSubscription } = apMedia,
        DEFAULT_RESULT = {
          data: {
            items: [{
              item: {
                altids: {
                  etag: '79d0ea3ba4ae89885134d8a27a702413_3a19aza0c0',
                  friendlykey: '342896153812',
                  itemid: '79d0ea3ba4ae89885134d8a27a702413'
                },
                pubstatus: 'usable',
                signals: [
                  'newscontent'
                ],
                type: 'text',
                version: 3
              },
              meta: {
                products: []
              }
            }]
          }
        };
    
      return {
        __,
        DEFAULT_RESULT,
        getApArticleBody,
        getApFeed,
        saveApPicture,
        searchAp,
        importApSubscription
      };
    }
    
    describe('searchAp', () => {
      async function setup_searchAp(options = { filterConditions: 'productid:42428' }) {
        const { __, DEFAULT_RESULT, searchAp } = setupApMedia(),
          filterConditions = options.filterConditions,
          result = { ...DEFAULT_RESULT, ...options.result },
          getStub = sinon.stub(),
          logStub = sinon.stub();

        getStub.resolves(result);
        __.log = logStub;
        __.rest.get = getStub;
        
        const response = await searchAp(filterConditions);

        return {
          getStub,
          logStub,
          response
        };
      }

      it('finds results from the search when filterConditions arg is passed', async () => {
        const { response } = await setup_searchAp();

        expect(response).to.be.an('array');
        expect(response[0]).to.have.property('pubstatus')
          .that.eqls('usable');
      });

      it('error in filterConditions type', async () => {
        const options = {
            filterConditions: {
              productid: '1245'
            }
          },
          { logStub, response } = await setup_searchAp(options);

        expect(response).to.equal(null);
        expect(logStub).to.have.been.calledOnceWith('error', 'filterConditions must be a string or have a value');
      });

      it('error in filterConditions, empty string', async () => {
        const options = {
            filterConditions: ''
          },
          { logStub, response } = await setup_searchAp(options);

        expect(response).to.equal(null);
        expect(logStub).to.have.been.calledOnceWith('error', 'filterConditions must be a string or have a value');
      });
    });

    describe('getApFeed', () => {
      async function setup_getApFeed(options = { isCacheStubResolved: true }) {
        const { __, getApFeed, DEFAULT_RESULT } = setupApMedia(),
          entitlements = [
            { name: 'Product 1', value: 42502 },
            { name: 'Product 2', value: 42802 }
          ],
          isCacheStubResolved = options.isCacheStubResolved,
          cacheResult = options.cacheResult,
          result = { ...DEFAULT_RESULT, ...options.result },
          cacheStub = sinon.stub(),
          locals = { site: { host: 'some.radio.com' } },
          logStub = sinon.stub(),
          getStub = sinon.stub(),
          retrieveListStub = sinon.stub();

        if (isCacheStubResolved) {
          cacheStub.resolves(cacheResult);
        } else {
          cacheStub.rejects();
        }

        getStub.resolves(result);
        retrieveListStub.resolves(entitlements);
        __.cache.get = cacheStub;
        __.log = logStub;
        __.rest.get = getStub;
        __.retrieveList = retrieveListStub;

        const response = await getApFeed(locals);

        return {
          cacheStub,
          logStub,
          response,
          retrieveListStub
        };
      }

      // TODO: figure out why this test passes locally but not when pushed to bitbucket
      it.skip('Get AP feed from next_page link', async () => {
        const options = {
            cacheResult: 'http://someurl.nextpage',
            isCacheStubResolved: true
          },
          { cacheStub, response } = await setup_getApFeed(options);

        expect(cacheStub).to.have.been.callCount(1);
        expect(response[0].item).to.have.property('type')
          .that.eqls('text');
      });

      // TODO: figure out why this test passes locally but not when pushed to bitbucket
      it.skip('Get AP feed from feed endpoint when next does not exist', async () => {
        const options = {
            cacheResult: null,
            isCacheStubResolved: true
          },
          { cacheStub, response } = await setup_getApFeed(options);

        expect(cacheStub).to.have.been.calledWith('ap-subscriptions-url');
        expect(response[0].item).to.have.property('signals')
          .that.eqls(['newscontent']);
        expect(response[0].products).to.be.an('array');
      });

      it('Error getting AP feed from next_page', async () => {
        const options = { isCacheStubResolved: false },
          { logStub, response } = await setup_getApFeed(options);

        expect(response).that.eql([]);
        expect(response).to.be.an('array');
        expect(logStub).to.have.been.calledOnceWith('error', 'Bad request getting ap feed from ap-media');
      });
    });

    describe('saveApPicture', () => {
      async function setup_saveApPicture(options = { isEndpoint: true }) {
        const { __, saveApPicture } = setupApMedia(),
          DEFAULT_ENDPOINT = 'http://ap.testing.com/image',
          endpoint = options.isEndpoint ? DEFAULT_ENDPOINT : null,
          result = {
            id: 'asgaJ2jf',
            data: {
              item: {
                renditions: {
                  main: {
                    href: 'https://api.testing/media/v/content/ceb68d0759c47'
                  }
                },
                pubstatus: 'usable',
                altids: {
                  etag: 'e0e14b78f5338c3a7674e49868a754b1_0a14aza0c0'
                },
                headline: 'This news does not real'
              }
            }
          },
          url = 'https://imageendpoint.com/hello.jpg',
          getStub = sinon.stub(),
          logStub = sinon.stub(),
          uploadImageStub = sinon.stub();
        
        getStub.resolves(result);
        uploadImageStub.resolves(url);
        __.log = logStub;
        __.rest.get = getStub;
        __.uploadImage = uploadImageStub;

        const response = await saveApPicture(endpoint);

        return {
          getStub,
          logStub,
          response,
          uploadImageStub
        };
      }

      it('saving an ap-media picture', async () => {
        const { response, uploadImageStub, getStub } = await setup_saveApPicture();

        expect(response).to.have.property('pubstatus')
          .that.eqls('usable');
        expect(uploadImageStub).to.have.been.callCount(1);
        expect(getStub).to.have.been.callCount(1);
      });

      it('Error saving an ap-media picture', async () => {
        const options = { isEndpoint: false },
          { logStub, response } = await setup_saveApPicture(options);

        expect(response).that.eql(null);
        expect(logStub).to.have.been.calledOnceWith('error', 'Missing pictureEndpoint');
      });
    });

    describe('getApArticleBody', () => {
      async function setup_getArticleBody(options = {}) {
        const { __, getApArticleBody } = setupApMedia(),
          DEFAULT_RESULT = `
            <?xml version="1.0" encoding="utf-8"?><nitf version="-//IPTC//DTD NITF 3.4//EN" change.date="October 18, 2006" change.time="19:30">
              <body>
                <body.head>
                  <hedline>
                    <hl1 id="headline">Death toll from flooding in Japan reaches 55, dozen missing</hl1>
                  </hedline>
                </body.head>
                <body.content>
                  <block>
                    <p>TOKYO (AP) — Soldiers used boats to rescue residents as floodwaters flowed down streets in southern Japanese towns hit by heavy rains that were expanding across the region on Tuesday. At least 55 people have died and a dozen remain missing.</p>
                    <p>Pounding rain since late Friday in the southern region of Kyushu has triggered widespread flooding. More rain was predicted in Kyushu and the western half of Japan's main island of Honshu as the rain front moved east.</p>
                    <p>In Fukuoka, on the northern part of Kyushu, soldiers waded through knee-high water pulling a boat carrying a mother, her 2-month-old baby and two other residents. </p>
                    <p>“Good job!" one of the soldiers said as he held the baby up to his chest while the mother got off the boat, Asahi video showed. Several children wearing orange life vests over their wet T-shirts arrived on another boat. </p>
                    <p>An older woman told public broadcaster NHK that she started walking down the road to evacuate, but floodwater rose quickly to her neck. Another woman said, “I was almost washed away and had to grab a electrical pole.”</p>
                    <p>The Fire and Disaster Management Agency said 49 victims were from riverside towns in Kumamoto prefecture. Another victim was a woman in her 80s found inside her flooded home in another prefecture. </p>
                    <p>About 3 million residents were advised to evacuate across Kyushu, Japan's third-largest island.</p>
                    <p>Tens of thousands of army troops, police and other rescue workers mobilized from around the country worked their way through mud and debris in the hardest-hit riverside towns along the Kuma River. Rescue operations have been hampered by the floodwater and continuing harsh weather.</p>
                    <p>Japan is at high risk of heavy rain in early summer when wet and warm air from the East China Sea flows into a seasonal rain front above the country. In July 2018, more than 200 people, about half of them in Hiroshima, died from heavy rain and flooding in southwestern Japan.</p>
                    <p>In Kuma village in Kumamoto prefecture, dozens of residents took shelter under a roofed structure in a park with no walls or floor. They sat on blue tarps spread on the dirt ground, with no partitions. The village office's electricity and communications had been cut.</p>
                    <p>Among the fatalities were 14 residents of a nursing home next to the Kuma River, known as the “raging river” because it is joined by another river just upstream and is prone to flooding. Its embankment collapsed, letting water gush into the nursing home.</p>
                    <p>___</p>
                    <p>Follow Mari Yamaguchi on Twitter at https://www.twitter.com/mariyamaguchi</p>
                  </block>
                </body.content>
              </body>
            </nitf>`,
          niftUrl = 'https://gettingaparticle.body',
          result = options.result || DEFAULT_RESULT,
          getHTMLStub = sinon.stub();

        getHTMLStub.resolves(result);
        __.rest.getHTML = getHTMLStub;

        const response = await getApArticleBody(niftUrl);

        return {
          getHTMLStub,
          response,
          DEFAULT_RESULT
        };
      }

      it('get ap article body', async () => {
        const { response, getHTMLStub, DEFAULT_RESULT } = await setup_getArticleBody();

        expect(response).to.eql(DEFAULT_RESULT);
        expect(getHTMLStub).to.have.been.callCount(1);
      });

      // TODO: create test for missing nitfURL
      // TODO: create test where an error is thrown
    });
  });
});
