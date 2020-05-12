'use strict';
const db = require('../../services/server/db'),
  { getComponentName } = require('clayutils'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  radioApiService = require('../../services/server/radioApi'),
  { uploadImage } = require('../../services/universal/s3'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
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
        nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [],
        defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';

      data._computed.articles = await Promise.all(nodes.map(async (item) => {
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
      const slug = locals.station && locals.station.site_slug,
        isMigrated = await isStationMigrated(slug);

      data._computed.station = locals.station.name;
      if (!isMigrated) {
        return renderStation(data, locals);// gets the articles from drupal and displays those instead
      }
    }

    if (data._computed.articles) {
      const primarySectionFronts = await retrieveList('primary-section-fronts', { locals });

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
  mapDataToFilters: async (uri, data, locals) => ({
    curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)],
    maxItems: getMaxItems(data)
  }),
  render
});
