'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  MAX_ITEMS = 3,
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../services/universal/constants'),
  getS3StationFeedImgUrl = require('../../services/server/get-s3-station-feed-img-url'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get'),
  queryService = require('../../services/server/query'),
  log = require('../../services/universal/log').setup({ file: __filename }),

  
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

    return Promise.resolve(data);
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: (uri, data) => ({
    curated: data.items,
    maxItems: MAX_ITEMS
  }),
  render,
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
