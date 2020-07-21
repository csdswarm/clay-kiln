/* eslint-disable max-nested-callbacks */
'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  apNewsImporter = require('./ap-news-importer'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('ap-news-importer', () => {
    function setup_apNewsImporter() {
      const { _internals: __, importArticle } = apNewsImporter;

      return { __, importArticle };
    }

    describe('importArticle', () => {
      async function setup_importArticle(options = {}) {
        const setup = setup_apNewsImporter(),
          { __, importArticle } = setup,
          HOST = 'some.radio.com',
          NEW_ID = fakeId('new'),
          DEFAULT_COMPONENTS = [
            { _ref: `${HOST}/_components/blockquote`, text: '' },
            { _ref: `${HOST}/_components/divider`, title: '' },
            { _ref: `${HOST}/_components/html-embed`, text: '' },
            { _ref: `${HOST}/_components/paragraph`, text: '' },
            { _ref: `${HOST}/_components/subheader`, text: '' }
          ],
          DEFAULT_CONTENT_ITEMS = [
            {
              _ref: `${HOST}/_components/paragraph/instances/${NEW_ID}`,
              text: 'Some content'
            },
            ...options.content || []
          ],
          DEFAULT_FEED_IMAGES = [
            {
              _ref: `${HOST}/_components/feed-image/instances/${NEW_ID}`,
              alt: '',
              url: ''
            },
            ...options.feedImages || []
          ],
          DEFAULT_SIDE_SHARES = [
            {
              _ref: `${HOST}/_components/share/instances/${NEW_ID}`,
              url: '',
              title: '',
              domain: HOST,
              pinImage: '',
              description: ''
            },
            ...options.sideShares || []
          ],
          DEFAULT_TAGS = [
            {
              _ref: `${HOST}/_components/tags/instances/${NEW_ID}`,
              items: []
            },
            ...options.tags || []
          ],
          DEFAULT_ARTICLE_DATA = {
            byline: [
              {
                names: [],
                prefix: 'by',
                sources: []
              }
            ],
            content: [
              {
                _ref: `${HOST}/_components/paragraph/instances/${NEW_ID}`
              }
            ],
            date: '2020-02-02T02:02:02.020+00:00',
            dateModified: '2020-02-02T02:02:02.020+00:00',
            feedImg: {
              _ref: `${HOST}/_components/feed-image/instances/${NEW_ID}`
            },
            headline: '',
            feedImgUrl: '',
            isContentFromAP: false,
            lead: [],
            msnTitle: '',
            noIndexNoFollow: false,
            primaryHeadline: '',
            secondarySectionFront: '',
            sectionFront: '',
            sideShare: {
              _ref: `${HOST}/_components/share/instances/${NEW_ID}`
            },
            slug: '',
            sources: [],
            stationSyndication: [],
            tags: {
              _ref: `${HOST}/_components/tags/instances/${NEW_ID}`
            },
            teaser: '',
            ...options.article
          },
          DEFAULT_AP_META = {
            signals: ['newscontent'],
            pubstatus: 'usable',
            editorialtypes: ['Lead'],
            altids: {
              itemid: 'abcdefg',
              etag: 'abcdefg_1234'
            }
          },
          EXISTING = buildApData('exists', HOST, DEFAULT_ARTICLE_DATA),
          NEW = buildApData('new', HOST, DEFAULT_ARTICLE_DATA),
          LOCALS = { site: { host: HOST } },
          ELASTIC_AP_ID_PATH = 'body.query.term[\'ap.itemid\']',
          apMeta = { ...DEFAULT_AP_META, ...options.apMeta },
          locals = { ...LOCALS, ...options.locals },
          stationMappings = options.stationMappings || {},
          stubs = [
            'assignDimensionsAndFileSize',
            'bySlug',
            'createPage',
            'dbDel',
            'dbGet',
            'dbPost',
            'dbPut',
            'dbRaw',
            'getApArticleBody',
            'log',
            'saveApPicture',
            'searchByQuery'
          ].reduce((acc, name) => ({ ...acc, [name]: sinon.stub() }), {});

        stubs.assignDimensionsAndFileSize.callsFake(async (uri, data) => {
          await Promise.resolve();

          Object.assign(data, {
            sizeInBytes: 50000,
            height: 515,
            width: 775,
            ...options.assignDimensionsAndFileSize
          });
        });

        stubs.bySlug.resolves(options.stationsBySlug || {});

        stubs.createPage.resolves({ ...NEW.PAGE_DATA, stationSlug: Object.keys(stationMappings)[0] });

        stubs.dbGet.resolves({});
        [
          { _ref: `${HOST}/_pages/new-two-col`, ...NEW.PAGE_ARTICLE },
          { _ref: NEW.ARTICLE.ID, ...NEW.PAGE_ARTICLE },
          { _ref: EXISTING.ARTICLE.ID, ...EXISTING.PAGE_ARTICLE },
          ...DEFAULT_COMPONENTS,
          ...DEFAULT_CONTENT_ITEMS,
          ...DEFAULT_FEED_IMAGES,
          ...DEFAULT_SIDE_SHARES,
          ...DEFAULT_TAGS
        ].forEach(item => stubs.dbGet.withArgs(item._ref).resolves(item));

        stubs.dbRaw
          .withArgs(sinon.match('jsonb_array_elements_text(data'), EXISTING.ARTICLE.ID)
          .resolves({ rows: [EXISTING.PAGE_DATA] });

        stubs.getApArticleBody.resolves({ block: {} });
        if (options.apBodyContent) {
          options.apBodyContent.forEach(obj => stubs.getApArticleBody.withArgs(...obj.args).resolves(obj.resolves));
        }

        stubs.saveApPicture.resolves({});
        if (options.saveApPicture) {
          stubs.saveApPicture
            .withArgs(options.saveApPicture.args)
            .resolves({
              pubstatus: 'usable',
              itemid: 'abcdef123456780',
              etag: 'someEtag',
              headline: 'some picture headline',
              url: 'https://api.ap.org/media/v/content/0123456789abcdef?qt=queryid&et=etag&ai=altid',
              ...options.saveApPicture.resolves
            });
        }

        stubs.searchByQuery.resolves([]);
        stubs.searchByQuery
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'some-existing-id'))
          .resolves([{ _id: EXISTING.ARTICLE.ID, ...DEFAULT_ARTICLE_DATA, ap: { itemid: 'some-existing-id' } }]);
        stubs.searchByQuery
          .withArgs(sinon.match.hasNested(ELASTIC_AP_ID_PATH, 'abcdefg'))
          .resolves([{
            _id: EXISTING.ARTICLE.ID, ...DEFAULT_ARTICLE_DATA,
            ap: { itemid: 'abcdefg', etag: 'abcdefg_4321' }
          }]);
        stubs.searchByQuery
          .withArgs(sinon.match(value => !value.body.query.term['ap.itemid']))
          .rejects('Error');

        Object.entries(stubs)
          .filter(([name]) => name !== 'bySlug')
          .forEach(([key, value]) => __[key] = value);

        __.getAllStations.bySlug = stubs.bySlug;

        const result = await importArticle(apMeta, stationMappings, locals);

        return {
          ...setup,
          ELASTIC_AP_ID_PATH,
          EXISTING,
          HOST,
          NEW,
          NEW_ID,
          locals,
          result,
          stubs,
          stationMappings
        };
      }

      it('marks content as unpublishable if it is not newscontent', async () => {
        const { result } = await setup_importArticle({ apMeta: { signals: [] } });

        expect(result)
          .to.have.property('isApContentPublishable')
          .that.eqls(false);
      });

      it('marks content as unpublishable if its pubstatus is not usable', async () => {
        const { result } = await setup_importArticle({ apMeta: { pubstatus: '' } });

        expect(result.isApContentPublishable)
          .to.eql(false);
      });

      it('marks content as unpublishable if its editorialtypes contains the word Kill', async () => {
        const { result } = await setup_importArticle({ apMeta: { editorialtypes: ['Kill'] } });

        expect(result.isApContentPublishable)
          .to.eql(false);
      });

      it('finds the existing article if this has been imported already', async () => {
        const
          itemid = 'some-existing-id',
          {
            ELASTIC_AP_ID_PATH,
            EXISTING,
            result,
            stubs
          } = await setup_importArticle({ apMeta: { altids: { itemid } } });

        expect(result).to.have.property('preExistingArticle');
        expect(stubs.searchByQuery).to.have.been.calledOnceWith(sinon.match.hasNested('index', 'published-content'));
        expect(stubs.searchByQuery).to.have.been.calledOnceWith(sinon.match.hasNested(ELASTIC_AP_ID_PATH, itemid));
        expect(stubs.dbRaw).to.have.been.calledOnceWith(sinon.match('article_id = ?'), EXISTING.ARTICLE.ID);
        expect(result).to.deep.include({
          preExistingArticle: {
            ...EXISTING.PAGE_DATA
          }
        });
      });

      it('creates a new article if one does not already exist', async () => {
        const {
            locals,
            result,
            stationMappings,
            stubs
          } = await setup_importArticle({
            stationsBySlug: {
              'test-station': {},
              'second-station': {}
            },
            stationMappings: {
              'test-station': {},
              'second-station': {}
            },
            apMeta: {
              altids: { itemid: 'not-in-unity-yet', etag: 'not-in-unity-yet_1234' }
            }
          }),
          [stationSlug] = Object.keys(stationMappings);

        expect(result.preExistingArticle).to.be.undefined;
        expect(result).to.have.property('article');
        expect(stubs.createPage).to.have.been.calledOnceWith(sinon.match.object, stationSlug, locals);
        expect(stubs.dbGet).to.have.been.calledWith(sinon.match('_pages/new-two-col'));
      });

      it('traps errors when checking for existing elastic content', async () => {
        const
          noItemId = sinon.match(value => value.body.query.term['ap.itemid'] === undefined),
          { result, stubs } = await setup_importArticle({ apMeta: { altids: { undefined } } });

        expect(stubs.searchByQuery).to.have.been.calledWith(noItemId);
        expect(stubs.log).to.have.been.calledOnceWith('error', 'Problem getting existing data from elastic');
        expect(result.preExistingArticle).to.be.undefined;
      });

      it('checks to see if anything has been modified by AP', async () => {
        const { result } = await setup_importArticle();

        expect(result).to.have.property('isModifiedByAP');
        expect(result.isModifiedByAP).to.eql(true);
      });

      describe('modified by AP', () => {
        async function setup_modifiedByAP(options = {}) {
          const
            NITF_REF = 'https://api.ap.org/media/v/content/c116ac3656f240238ee7529720e4a4b8/download?type=text&format=NITF',
            P_TEXT = 'basic paragraph text',
            setup = await setup_importArticle({
              ...options,
              apBodyContent: options.apBodyContent || [
                {
                  args: [NITF_REF], resolves: {
                    block: {
                      children: [
                        { localName: 'p', innerHTML: options.nitfPara || P_TEXT }
                      ]
                    }
                  }
                }
              ],
              apMeta: {
                altids: {
                  itemid: 'xyz123',
                  etag: 'xyz123_mod1'
                },
                version: 1,
                ednote: 'go ahead and publish, there are no problems here.',
                headline: 'Something tragic happened',
                headline_extended: 'Something tragic happened on the way to heaven',
                subject: [
                  { name: 'Heaven', creator: 'Machine' },
                  { name: 'Earth', creator: 'Machine' },
                  { name: 'Tragedy', creator: 'Machine' }
                ],
                associations: {
                  1: {
                    uri: 'https://api.ap.org/media/v/content/0726a2a7a06b48d0af1e41bf04fe8f80',
                    altids: { itemid: '0726a2a7a06b48d0af1e41bf04fe8f80' },
                    type: 'picture',
                    headline: 'Something tragic'
                  }
                },
                renditions: {
                  nitf: {
                    href: NITF_REF
                  }
                },
                ...options.apMeta
              }
            });

          return { ...setup };
        }

        it('maps AP data to article if content is publishable', async () => {
          const { result } = await setup_modifiedByAP(),
            { article } = result,
            expectedTitle = 'Something tragic happened',
            expected = {
              ap:
                {
                  itemid: 'xyz123',
                  etag: 'xyz123_mod1',
                  version: 1,
                  ednote: 'go ahead and publish, there are no problems here.'
                },
              headline: expectedTitle,
              msnTitle: expectedTitle,
              pageDescription: 'Something tragic happened on the way to heaven',
              pageTitle: expectedTitle,
              plainTextPrimaryHeadline: expectedTitle,
              plainTextShortHeadline: expectedTitle,
              primaryHeadline: expectedTitle,
              seoDescription: 'Something tragic happened on the way to heaven',
              seoHeadline: expectedTitle,
              shortHeadline: expectedTitle,
              slug: 'something-tragic-happened'
            };

          // deep include expects "sub" objects to be identical, so, since we are only checking
          // certain values in the things like sideShare and tags, extract those to their own
          // assertions
          expect(article).to.deep.include({
            ...expected
          });

          expect(article.sideShare).to.deep.include({
            shortTitle: expectedTitle,
            title: expectedTitle
          });

          expect(article.tags).to.deep.include({
            items: [
              { text: 'AP News', slug: 'ap-news' },
              { text: 'Heaven', slug: 'heaven' },
              { text: 'Earth', slug: 'earth' },
              { text: 'Tragedy', slug: 'tragedy' }
            ]
          });

        });

        it('maps AP data to meta title when publishable', async () => {
          const
            expectedTitle = 'You can go your own way!',
            { result } = await setup_modifiedByAP({ apMeta: { headline: expectedTitle } }),
            { metaTitle } = result;

          expect(metaTitle).to.deep.include({
            kilnTitle: expectedTitle,
            ogTitle: expectedTitle,
            title: expectedTitle,
            twitterTitle: expectedTitle
          });
        });

        it('maps AP data to meta description when publishable', async () => {
          const
            expected = 'You can go your own way, but it might be really, really far!',
            { result } = await setup_modifiedByAP({ apMeta: { headline_extended: expected } }),
            { metaDescription } = result;

          expect(metaDescription).to.deep.include({
            description: expected
          });
        });

        it('maps AP image data to the article and meta-image when publishable', async () => {
          const
            imageTitle = 'Something is on Fire',
            newImageUrl = 'https://images.radio.com/aiu-media/SomethingIsOnFire4832149-43125-5415.jpg',
            apUri = 'https://api.ap.org/media/v/content/abcdef123456789?qt=QueryId&et=someEtag&ai=SoMeAltID',
            { result } = await setup_modifiedByAP({
              saveApPicture: {
                args: apUri,
                resolves: {
                  headline: imageTitle,
                  url: newImageUrl
                }
              },
              apMeta: {
                associations: {
                  1: {
                    uri: apUri,
                    type: 'picture',
                    headline: imageTitle
                  },
                  2: {
                    uri: 'https://api.ap.org/media/v/content/abcdef123456780?qt=QueryId&et=someEtag&ai=SoMeAltID',
                    type: 'picture',
                    headline: 'some other image, we don\'t really care'
                  }
                }
              },
              image: {
                height: 515,
                sizeInBytes: 50000,
                title: imageTitle,
                width: 775,
                url: newImageUrl
              }
            }),
            { article, metaImage } = result;

          expect(article).to.deep.include({
            feedImgUrl: newImageUrl
          });

          // deep include expects exact values on sub objects, so do each sub object separately
          expect(article.lead[0]).to.deep.include(
            {
              alt: imageTitle,
              height: 515,
              sizeInBytes: 50000,
              url: newImageUrl,
              width: 775
            }
          );

          expect(article.feedImg).to.deep.include({
            alt: imageTitle,
            height: 515,
            sizeInBytes: 50000,
            url: newImageUrl,
            width: 775
          });

          expect(article.sideShare).to.deep.include({
            pinImage: newImageUrl
          });

          expect(metaImage).to.deep.include({
            imageUrl: newImageUrl
          });
        });

        it('maps the body content when the article is publishable', async () => {
          const
            BLOCKQUOTE_TEXT = 'Some more<br>text that would<br>have been inside a <br>blockquote',
            BULLETS = ['Some Text', 'More Text'],
            DEF_LIST_TEXT = '<dl><dt>Topic</dt><dd>Definition</dd></dl>',
            ITEM_ID = 'content_test',
            MEDIA_TEXT = '<img src="some-source.jpg"><div class="caption">possible contents of media tag</div>',
            NITF_REF = 'https://api.ap.org/media/v/content/abcdefg1234567/download?type=text&format=NITF',
            P_TEXT = 'Some text that could be html so let\'s have an <a href="#">Anchor</a> tag in it.',
            PRE_TEXT = '<pre>This might have\nNewlines in it and stuff</pre>',
            TABLE_TEXT = '<table><thead><tr><th>stuff</th></tr></thead><tbody><tr><td>things</td></tr></tbody></table>',
            querySelectorAll = () => BULLETS.map(innerHTML => ({ innerHTML })),
            { HOST, result } = await setup_modifiedByAP({
              apMeta: {
                altids: {
                  itemid: `${ITEM_ID}`,
                  etag: `${ITEM_ID}_mod1`
                },
                renditions: {
                  nitf: {
                    href: NITF_REF
                  }
                }
              },
              apBodyContent: [
                {
                  args: [NITF_REF], resolves: {
                    block: {
                      children: [
                        { localName: 'bq', innerHTML: BLOCKQUOTE_TEXT },
                        { localName: 'dl', outerHTML: DEF_LIST_TEXT },
                        { localName: 'hr' },
                        { localName: 'media', innerHTML: MEDIA_TEXT },
                        { localName: 'nitf-table' },
                        { localName: 'ol', querySelectorAll },
                        { localName: 'p', innerHTML: P_TEXT },
                        { localName: 'pre', outerHTML: PRE_TEXT },
                        { localName: 'table', outerHTML: TABLE_TEXT },
                        { localName: 'ul', querySelectorAll }
                      ]
                    }
                  }
                }
              ]
            });

          expect(result.article.content).to.deep.include(
            { _ref: `${HOST}/_components/blockquote/instances/ap-${ITEM_ID}-1`, text: BLOCKQUOTE_TEXT },
            { _ref: `${HOST}/_components/html-embed/instances/ap-${ITEM_ID}-2`, text: DEF_LIST_TEXT },
            { _ref: `${HOST}/_components/divider/instances/ap-${ITEM_ID}-3`, title: '' },
            { _ref: `${HOST}/_components/html-embed/instances/ap-${ITEM_ID}-4`, text: MEDIA_TEXT },
            { _ref: `${HOST}/_components/paragraph/instances/ap-${ITEM_ID}-5`, text: '1. Some text<br>\n2. More Text' },
            { _ref: `${HOST}/_components/paragraph/instances/ap-${ITEM_ID}-6`, text: P_TEXT },
            { _ref: `${HOST}/_components/html-embed/instances/ap-${ITEM_ID}-7`, text: PRE_TEXT },
            { _ref: `${HOST}/_components/html-embed/instances/ap-${ITEM_ID}-8`, text: TABLE_TEXT },
            { _ref: `${HOST}/_components/paragraph/instances/ap-${ITEM_ID}-9`, text: '• Some text<br>\n• More Text' }
          );
        });

        it('saves all mapped data to the db', async () => {
          const
            AP_URL = 'https://api.ap.org/media/v/content/save-image?qt=id&et=tag&ai=altId',
            IMG_URL = 'some-host/aiu-images/some-image.jpg',
            IMG_TEXT = 'Some stuff happened',
            TITLE = 'Sometimes stuff happens',
            DESCRIPTION = 'When bad stuff happens, we all suffer, but when good things happen, we are happy.',
            P_TEXT = 'Plain old paragraph',
            { __ } = await setup_modifiedByAP({
              apMeta: {
                headline: TITLE,
                headline_extended: DESCRIPTION,
                associations: {
                  1: {
                    uri: AP_URL,
                    type: 'picture',
                    headline: IMG_TEXT
                  }
                },
                subject: [
                  { name: 'I do not care', creator: 'Editorial' },
                  { name: 'Stuff', creator: 'Machine' },
                  { name: 'Things', creator: 'Machine' }
                ]
              },
              nitfPara: P_TEXT,
              saveApPicture: {
                args: AP_URL,
                resolves: {
                  headline: IMG_TEXT,
                  url: IMG_URL
                }
              }
            });

          expect(__.dbPost).to.have.been.calledWith(
            sinon.match('_components/paragraph'),
            sinon.match.has('text', P_TEXT)
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/feed-image'),
            sinon.match.has('alt', IMG_TEXT).and(sinon.match.has('url', IMG_URL))
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/meta-description'),
            sinon.match.has('description', sinon.match(DESCRIPTION))
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/meta-image'),
            sinon.match.has('imageUrl', IMG_URL)
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/meta-title'),
            sinon.match.has('title', TITLE)
              .and(sinon.match.has('kilnTitle', TITLE))
              .and(sinon.match.has('ogTitle', TITLE))
              .and(sinon.match.has('twitterTitle', TITLE))
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/share'),
            sinon.match.has('pinImage', IMG_URL)
              .and(sinon.match.has('shortTitle', TITLE))
              .and(sinon.match.has('title', TITLE))
          );
          expect(__.dbPut).to.have.been.calledWith(
            sinon.match('_components/tags'),
            sinon.match.has('items', [
              { slug: 'ap-news', text: 'AP News' },
              { slug: 'stuff', text: 'Stuff' },
              { slug: 'things', text: 'Things' }
            ])
          );
        });
      });

      it('gets any new stations to map to', async () => {
        const { result } = await setup_importArticle({
          stationsBySlug: {
            stationA: { callsign: 'STA', name: 'Station A' }
          },
          apMeta: {
            altids: { itemid: 'not-in-unity-yet', etag: 'not-in-unity-yet_1234' }
          },
          stationMappings: {
            stationA: { sectionFront: 'music', secondarySectionFront: 'urban' }
          }
        });

        expect(result).to.have.property('newStations').that.eqls([{
          callsign: 'STA',
          sectionFront: 'music',
          secondarySectionFront: 'urban',
          stationName: 'Station A',
          stationSlug: 'stationA'
        }]);
      });

      it('only gets new stations if article already exists', async () => {
        const { result } = await setup_importArticle({
          stationsBySlug: {
            stationA: { callsign: 'STA', name: 'Station A' },
            stationB: { callsign: 'STB', name: 'Station B' },
            stationC: { callsign: 'STC', name: 'Station C' }
          },
          apMeta: {
            altids: { itemid: 'some-existing-id' }
          },
          stationMappings: {
            stationA: { sectionFront: 'music', secondarySectionFront: 'urban' },
            stationB: { sectionFront: 'news' },
            stationC: { sectionFront: 'music', secondarySectionFront: 'pop' }
          },
          article: {
            slug: 'some-news-slug',
            stationSlug: 'stationA',
            sectionFront: 'music',
            secondarySectionFront: 'urban',
            stationSyndication: [
              {
                callsign: 'STB',
                sectionFront: 'news',
                stationName: 'Station B',
                stationSlug: 'stationB',
                syndicatedArticleSlug: '/stationB/news/some-news-slug'
              }
            ]
          }
        });

        expect(result.newStations).to.eql([{
          callsign: 'STC',
          sectionFront: 'music',
          secondarySectionFront: 'pop',
          stationName: 'Station C',
          stationSlug: 'stationC'
        }]);

      });
    });
  });
});

/**
 * Produces constants for common data to use and reflect on for testing, modifying each to reflect the generality
 * of what is being tested.
 * @param {string} idPostFix short string to append to the end of the fake id to make it unique and recognizable
 * @param {string} host some fake hostname like test.clay.radio.com or something
 * @param {object} data the data to include as the page's article data
 * @returns {{META: {IMAGE: string, DESCRIPTION: string, TITLE: string, TAGS: string}, ARTICLE: {ID: string}, PAGE_DATA: {head: string[], main: [string]}, PAGE_ARTICLE}}
 */
function buildApData(idPostFix, host, data) {
  const
    INSTANCE_ID = fakeId(idPostFix),
    ARTICLE = {
      ID: `${host}/_components/article/instances/${INSTANCE_ID}`
    },
    META = {
      TITLE: `${host}/_components/meta-title/instances/${INSTANCE_ID}`,
      DESCRIPTION: `${host}/_components/meta-description/instances/${INSTANCE_ID}`,
      IMAGE: `${host}/_components/meta-image/instances/${INSTANCE_ID}`,
      TAGS: `${host}/_components/meta-tags/instances/${INSTANCE_ID}`
    };

  return {
    ARTICLE,
    META,
    PAGE_DATA: {
      head: [...Object.values(META)],
      main: [ARTICLE.ID]
    },
    PAGE_ARTICLE: {
      ...data
    }
  };
}

// TODO: fix so that we just use the ap_id for this stuff, why the heck am I making this so hard?
/**
 * Creates a fake id for testing that looks similar to what we would expect to see in a
 * real id
 * @param {string} postfix
 * @returns {string}
 */
function fakeId(postfix) {
  return postfix.toLowerCase().padStart(26, 'ck64dqppgzzzzabcd012345678');
}
