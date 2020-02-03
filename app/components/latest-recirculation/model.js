'use strict';
const { recirculationData } = require('../../services/universal/recirculation'),
  db = require('../../services/server/db'),
  radioApiService = require('../../services/server/radioApi'),
  { uploadImage } = require('../../services/universal/s3'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  maxItems = 5,
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
    data.articles = []; // Default to empty array so it's not undefined
    if (locals.station.id && locals.station.website) {
      const feedUrl = `${locals.station.website.replace(/\/$/, '')}/station_feed.json`,
        feed = await radioApiService.get(feedUrl, null, (response) => response.nodes, {}, locals),
        nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [],
        defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';

      data.station = locals.station.name;
      data.articles = await Promise.all(nodes.map(async (item) => {
        return {
          feedImgUrl: item.node['OG Image'] ? await uploadImage(item.node['OG Image'].src) : defaultImage,
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
  render = function (ref, data, locals) {
    if (data.populateFrom === 'station' && locals.params) {
      return renderStation(data, locals);
    }

    return Promise.resolve(data);
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: async (uri, data, locals) => ({
    curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)]
  }),
  maxItems,
  render,
  skipRender: data => data.populateFrom === 'station'
});
