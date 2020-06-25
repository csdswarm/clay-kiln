'use strict';

const db = require('../../services/server/db'),
  _get = require('lodash/get'),
  { getComponentName } = require('clayutils'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  radioApiService = require('../../services/server/radioApi'),
  { addAmphoraRenderTime } = require('../../services/universal/utils'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../services/universal/constants'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  getS3StationFeedImgUrl = require('../../services/server/get-s3-station-feed-img-url'),
  queryService = require('../../services/server/query'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  elasticFields = [
    'date',
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  /**
   * Determine if latest-recirculation is within a multi-column
   *
   * @param {object} data
   * @returns {boolean}
   */
  isMultiColumn = (data) => {
    return data._computed.parents.some(ref => getComponentName(ref) === 'multi-column');
  },
  /**
   * Gets the number of items to display
   *
   * @param {object} data
   * @returns {number}
   */
  getMaxItems = (data) => isMultiColumn(data) ? 4 : 5,
  /**
   * latest-recirculation gets additional curated items from the trending-recirculation component
   * This is different from other recirculation components, but has been in place for awhile.  It may be
   * able to be changed
   *
   * @param {object} locals
   *
   * @returns {array} items
   */
  getItemsFromTrendingRecirculation = async (locals) => {
    const trendingRecircRef = `${locals.site.host}/_components/trending-recirculation/instances/default@published`,
      start = new Date();

    try {
      const trendingRecircData = await db.get(trendingRecircRef);

      return trendingRecircData.items;
    } catch (e) {
      if (e.name === 'NotFoundError') {
        return [];
      } else {
        throw e;
      }
    } finally {
      addAmphoraRenderTime(locals, {
        label: 'db.get trendingRecircRef',
        ms: new Date() - start
      });
    }
  },
  /**
   * Also existing functionality that may be able to be replaced.  This pulls articles from the station_feed
   * provided by the radioApiService.  It can likely be updated to pull from elastic once stations are live
   *
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  renderStation = async (data, locals) => {
    const { station } = locals;

    if (station.id && station.website) {
      const feedUrl = `${station.website.replace(/\/$/, '')}/station_feed.json`,
        feed = await radioApiService.get(
          feedUrl,
          null,
          response => response.nodes,
          {
            amphoraTimingLabelPrefix: 'render station',
            shouldAddAmphoraTimings: true
          },
          locals
        ),
        nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [];

      data._computed.articles = await Promise.all(nodes.map(async (item) => {
        const feedImgUrl = _get(item, "node['OG Image'].src"),
          s3FeedImgUrl = feedImgUrl
            ? await getS3StationFeedImgUrl(feedImgUrl, locals, {
              shouldAddAmphoraTimings: true,
              amphoraTimingLabelPrefix: 'render station'
            })
            : DEFAULT_RADIOCOM_LOGO;

        return {
          feedImgUrl: s3FeedImgUrl,
          externalUrl: item.node.URL,
          primaryHeadline: item.node.field_engagement_title || item.node.title
        };
      }));
    }

    return data;
  },


  /**
   * Determines whether or not a station is migrated, given the station slug
   * @param {string} stationSlug
   * @param {object} locals
   * @returns {Promise<boolean>}
   */
  isStationMigrated = async function (stationSlug, locals) {
    if (!stationSlug) {
      return false;
    }

    const query = queryService.newQueryWithCount('published-stations', 1, locals);

    queryService.addMust(query, { match: { stationSlug } });

    try {
      const results = await queryService.searchByQuery(query, locals, { shouldDedupeContent: false });

      return results.length > 0;
    } catch (e) {
      log('error', e);
      return false;
    }
  },

  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    if (data.populateFrom === 'station' && locals.params) {
      data._computed.station = locals.station.name;
      if (!data._computed.isMigrated) {
        return renderStation(data, locals);// gets the articles from drupal and displays those instead
      }
    }

    if (data._computed.articles) {
      const primarySectionFronts = await retrieveList(
        'primary-section-fronts', {
          locals,
          shouldAddAmphoraTimings: true
        }
      );

      data._computed.articles = data._computed.articles.map(item => ({
        ...item,
        label: getSectionFrontName(item.sectionFront, primarySectionFronts)
      }));
    }
    data._computed.isMultiColumn = isMultiColumn(data);

    return Promise.resolve(data);
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: async (uri, data, locals) => {
    return {
      curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)],
      maxItems: getMaxItems(data)
    };
  },
  render,
  shouldAddAmphoraTimings: true,
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      uri: result._id,
      canonicalUrl: item.url || result.canonicalUrl,
      date: item.overrideDate || result.date,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label: item.overrideDate || result.label,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      sectionFront: item.overrideSectionFront || result.sectionFront
    });
  },
  skipRender: async (data, locals) => {
    const isStation = data.populateFrom === 'station' && locals.params;

    if (isStation) {
      const slug = locals.station && locals.station.site_slug,
        isMigrated = await isStationMigrated(slug);

      data._computed.isMigrated = isMigrated;

      return !isMigrated;
    }

    return false;
  }
});
