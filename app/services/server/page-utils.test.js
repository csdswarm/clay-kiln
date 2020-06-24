/* eslint-disable max-nested-callbacks */
'use strict';
const
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  pageUtils = require('./page-utils'),

  { expect } = chai;

chai.use(sinonChai);

describe('server', () => {
  afterEach(sinon.restore);

  describe('page-utils', () => {
    function setup_pageUtils() {
      const
        { _internals: __, createPage, getPage } = pageUtils,
        ALL_STATIONS = {
          bySlug: {
            'station-1': {
              site_slug: 'station-1'
            }
          }
        },
        HOST = 'unity-host.com',
        LOCALS = {
          edit: true,
          site: { host: HOST },
          useStagingApi: false
        },
        PAGE_ID = 'unity-host.com/_pages/1',
        PAGE_DATA = {
          head: [
            'unity-host.com/_components/meta-title/instances/1',
            'unity-host.com/_components/meta-description/instances/1',
            'unity-host.com/_components/meta-image/instances/1',
            'unity-host.com/_components/meta-url/instances/1',
            'unity-host.com/_components/meta-tags/instances/1'
          ],
          main: [
            'unity-host.com/_components/article/instances/1'
          ],
          layout: 'unity-host.com/_layouts/two-column-layout/instances/article',
          tertiary: [
            'unity-host.com/_components/google-ad-manager/instances/mediumRectangleTop',
            'unity-host.com/_components/latest-recirculation/instances/tertiary-1',
            'unity-host.com/_components/google-ad-manager/instances/halfPageBottom'
          ],
          pageHeader: [
            'unity-host.com/_components/google-ad-manager/instances/billboardTop'
          ]
        },
        PAGE_META = {
          url: 'http://unity-host.com/some-slug',
          history: [
            {
              users: [
                {
                  username: 'robot'
                }
              ],
              action: 'publish',
              timestamp: '2020-02-02T02:02:02.020Z'
            }
          ],
          siteSlug: 'demo',
          createdAt: '2020-02-02T02:02:02.020Z',
          published: true,
          urlHistory: [
            'http://unity-host.com/some-slug'
          ],
          publishTime: '2020-02-02T02:02:02.020Z',
          firstPublishTime: '2020-02-02T02:02:02.020Z'
        };

      return {
        __,
        ALL_STATIONS,
        createPage,
        getPage,
        HOST,
        LOCALS,
        PAGE_DATA,
        PAGE_ID,
        PAGE_META
      };
    }

    describe('createPage', () => {
      function setup_createPage() {
        const { __, ALL_STATIONS, createPage, PAGE_DATA, HOST, LOCALS, PAGE_META } = setup_pageUtils(),
          GENERIC_STATION_SLUG = 'kabc-usa',
          NEW_META = { ...PAGE_META, stationSlug: GENERIC_STATION_SLUG },
          PAGES_URI = HOST + '/_pages/',
          NEW_PAGE_REF = PAGES_URI + 'some-new-ref-id',
          NEW_PAGE_DATA = { ...PAGE_DATA, _ref: NEW_PAGE_REF },
          addStationSlug = sinon.spy(__, 'addStationSlug'),
          createAmphoraPage = sinon.stub(__, 'createAmphoraPage')
            .withArgs(PAGES_URI, PAGE_DATA, LOCALS)
            .resolves(NEW_PAGE_DATA),
          elasticPut = sinon.stub(__, 'elasticPut')
            .resolves(),
          getAllStations = sinon.stub(__, 'getAllStations')
            .withArgs({ locals: LOCALS })
            .resolves(ALL_STATIONS),
          getMeta = sinon.stub()
            .withArgs(NEW_PAGE_REF)
            .resolves(PAGE_META),
          putMeta = sinon.stub()
            .withArgs(NEW_PAGE_REF, NEW_META)
            .resolves(NEW_META);

        // amphora registers these methods weirdly (e.g. at run time), so they don't stub as expected
        // Need to explicitly replace them with stubs in order to unit test them.
        __.amphoraDb.getMeta = getMeta;
        __.amphoraDb.putMeta = putMeta;

        return {
          addStationSlug,
          ALL_STATIONS,
          createAmphoraPage,
          createPage,
          elasticPut,
          PAGE_DATA,
          GENERIC_STATION_SLUG,
          getAllStations,
          getMeta,
          HOST,
          LOCALS,
          NEW_META,
          NEW_PAGE_DATA,
          NEW_PAGE_REF,
          PAGES_URI,
          putMeta
        };
      }

      it('creates a new page using existing page data', async () => {
        const {
            addStationSlug,
            createAmphoraPage,
            createPage,
            getAllStations,
            getMeta,
            LOCALS,
            NEW_PAGE_DATA,
            NEW_PAGE_REF,
            PAGE_DATA,
            PAGES_URI
          } = setup_createPage(),
          result = await createPage(PAGE_DATA, '', LOCALS);

        expect(getAllStations).not.to.have.been.called;
        expect(createAmphoraPage).to.have.been.calledOnceWith(PAGES_URI, PAGE_DATA, LOCALS);
        expect(addStationSlug).to.have.been.calledOnceWith(NEW_PAGE_REF, '');
        expect(getMeta).not.to.have.been.called;

        expect(result).to.eql(NEW_PAGE_DATA);
      });

      it('adds a stationSlug to the data if it was supplied', async () => {
        const {
            addStationSlug,
            createAmphoraPage,
            createPage,
            elasticPut,
            PAGE_DATA,
            GENERIC_STATION_SLUG,
            getAllStations,
            getMeta,
            LOCALS,
            NEW_META,
            NEW_PAGE_DATA,
            NEW_PAGE_REF,
            PAGES_URI,
            putMeta
          } = setup_createPage(),
          result = await createPage(PAGE_DATA, GENERIC_STATION_SLUG, LOCALS);

        expect(getAllStations).to.have.been.calledOnceWith({ locals: LOCALS });
        expect(createAmphoraPage).to.have.been.calledOnceWith(PAGES_URI, PAGE_DATA, LOCALS);
        expect(addStationSlug).to.have.been.calledOnceWith(NEW_PAGE_REF, GENERIC_STATION_SLUG);
        expect(getMeta).to.have.been.calledOnceWith(NEW_PAGE_REF);
        expect(putMeta).to.have.been.calledOnceWith(NEW_PAGE_REF, NEW_META);
        expect(elasticPut).to.have.been.calledOnceWith('pages', NEW_PAGE_REF, NEW_META);

        expect(result).to.eql(NEW_PAGE_DATA);
      });
    });
  });
});
