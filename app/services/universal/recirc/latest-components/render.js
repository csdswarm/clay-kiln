'use strict';
const { getSectionFrontName, retrieveList } = require('../../../server/lists'),
  { getComponentName } = require('clayutils'),
  fetchStationFeeds = require('../../../server/fetch-station-feeds'),
  getS3StationFeedImgUrl = require('../../../server/get-s3-station-feed-img-url'),
  _get = require('lodash/get'),
  { DEFAULT_RADIOCOM_LOGO } = require('../../../universal/constants'),
  radioApiService = require('../../../server/radioApi'),
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
  },
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
   * Determine if render-rss is within a latest-content
   *
   * @param {object} _ref
   * @returns {boolean}
   */
  isLatestContentColumn = (_ref) => getComponentName(_ref) === 'latest-content-column',
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    data._computed.isMultiColumn = isMultiColumn(data);

    // Account for inccorrect formatting of data.tag in the database for previously created content.
    // Instances of data.tag that do not return an empty array, or properly formatted tag array will break the kiln UI.
    // e.g. tag array: data.tag: [] || data.tag: [{ text: 'tag' }].
    if (data.tag.length === 0) {
      data.tag = [];
    } else if (Array.isArray(data.tag)) {
      data.tag = data.tag.map((tag) => typeof tag === 'string' ? { text: tag } : tag);
    }

    if (data.populateFrom === 'station' && locals.params) {
      data._computed.station = locals.station.name;
      if (!data._computed.isMigrated) {
        return renderStation(data, locals);// gets the articles from drupal and displays those instead
      }
    }

    if (data.populateFrom === 'rss-feed' && data.rssFeed) {
      return renderRssFeed(data, locals, isLatestContentColumn(ref) ? 3 : 5);
    }

    if (data._computed.articles) {
      const primarySectionFronts = await retrieveList(
        'primary-section-fronts', {
          locals,
          shouldAddAmphoraTimings: true
        }
      );

      data._computed.articles = data._computed.articles.map(item => {
        const label = getSectionFrontName(item.label || item.sectionFront, primarySectionFronts);

        return {
          ...item,
          label
        };
      });
    }
    // Reset value of customTitle to avoid an override inside the template when the rss option is not selected.
    if (data.populateFrom !== 'rss-feed') {
      data.customTitle = '';
    }
    return data;
  };

module.exports = render;
