
'use strict';

const fetchStationFeeds = require('../../server/fetch-station-feeds'),
  getS3StationFeedImgUrl = require('../../server/get-s3-station-feed-img-url'),
  _get = require('lodash/get'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../universal/constants'),
  radioApiService = require('../../server/radioApi'),
  queryService = require('../../server/query'),
  log = require('../log').setup({ file: __filename }),

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

  skipRender = async (data, locals) => {
    const isStation = (data.populateFrom === 'station' && locals.params) || (data.populateFrom === 'rss-feed' && data.rssFeed !== '');

    if (isStation) {
      const slug = locals.station && locals.station.site_slug,
        isMigrated = await isStationMigrated(slug);

      data._computed.isMigrated = isMigrated;

      return !isMigrated;
    }

    return false;
  },
  /**
   * This pulls articles from the station_feed provided by the Frequency API.
   *
   * @param {object} data
   * @param {object} locals
   * @param {number} numberOfArticles
   * @returns {Promise}
   */
  renderRssFeed = async (data, locals, numberOfArticles = 5) => {
    const feed = await fetchStationFeeds(data, locals),
      nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, numberOfArticles) : [];

    data._computed.station = locals.station.name;
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
    })
    );
    return data;
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
  };

module.exports = {
  renderRssFeed,
  renderStation,
  skipRender
};
