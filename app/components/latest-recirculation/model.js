'use strict';
const db = require('../../services/server/db'),
  { getComponentName } = require('clayutils'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  radioApiService = require('../../services/server/radioApi'),
  { uploadImage } = require('../../services/universal/s3'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  elasticFields = [
    'date',
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  fetchStationFeeds = require('../../services/server/fetch-station-feeds'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../services/universal/constants'),
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
   * @returns {array} items
   */
  getItemsFromTrendingRecirculation = async (locals) => {
    const trendingRecircRef = `${locals.site.host}/_components/trending-recirculation/instances/default@published`;

    try {
      const trendingRecircData = await db.get(trendingRecircRef);

      return trendingRecircData.items;
    } catch (e) {
      if (e.message === `Key not found in database [${trendingRecircRef}]`) {
        return [];
      } else {
        throw e;
      }
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
    if (locals.station.id && locals.station.website) {
      const feedUrl = `${locals.station.website.replace(/\/$/, '')}/station_feed.json`,
        feed = await radioApiService.get(feedUrl, null, (response) => response.nodes, {}, locals),
        nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [];

      data._computed.station = locals.station.name;
      data._computed.articles = await Promise.all(
        nodes.map(async (item) => ({
          feedImgUrl: item.node['OG Image'] ? await uploadImage(item.node['OG Image'].src) : DEFAULT_RADIOCOM_LOGO,
          externalUrl: item.node.URL,
          primaryHeadline: item.node.field_engagement_title || item.node.title
        }))
      );
    }
    return data;
  },
  /**
   * This pulls articles from the station_feed provided by the Frequency API.
   *
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  renderRssFeed = async (data, locals) => {
    const feed = await fetchStationFeeds(data, locals),
      nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [];

    data._computed.station = locals.station.name;
    data._computed.articles = await Promise.all(
      nodes.map(async (item) => ({
        feedImgUrl: item.node['OG Image'] ? await uploadImage(item.node['OG Image'].src) : DEFAULT_RADIOCOM_LOGO,
        externalUrl: item.node.URL,
        primaryHeadline: item.node.field_engagement_title || item.node.title
      }))
    );
    return data;
  },
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    data._computed.isMultiColumn = isMultiColumn(data);

    if (data.populateFrom === 'station' && locals.params) {
      return renderStation(data, locals);
    }

    if (data.populateFrom === 'rss-feed' && data.rssFeed) {
      return renderRssFeed(data, locals);
    }

    const primarySectionFronts = await retrieveList('primary-section-fronts', locals);

    if (data._computed.articles) {
      data._computed.articles = data._computed.articles.map(item => ({
        ...item,
        label: getSectionFrontName(item.sectionFront, primarySectionFronts)
      }));
    }
    return data;
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: async (uri, data, locals) => ({
    curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)],
    maxItems: getMaxItems(data)
  }),
  render,
  skipRender: (data, locals) => (data.populateFrom === 'station' && locals.params) || (data.populateFrom === 'rss-feed' && data.rssFeed !== '')
});
