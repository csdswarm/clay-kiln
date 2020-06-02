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
      if (e.message === `Key not found in database [${trendingRecircRef}]`) {
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

      data._computed.station = station.name;
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
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    if (data.populateFrom === 'station' && locals.params) {
      return renderStation(data, locals);
    }

    const primarySectionFronts = await retrieveList(
      'primary-section-fronts',
      locals,
      { shouldAddAmphoraTimings: true }
    );

    if (data._computed.articles) {
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
  skipRender: (data, locals) => data.populateFrom === 'station' && locals.params,
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      canonicalUrl: item.url || result.canonicalUrl,
      date: item.overrideDate || result.date,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label: item.overrideDate || result.label,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      sectionFront: item.overrideSectionFront || result.sectionFront
    });
  }
});
