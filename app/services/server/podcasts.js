'use strict';

const _concat = require('lodash/concat'),
  _flatten = require('lodash/flatten'),
  {
    CLAY_SITE_PROTOCOL: protocol,
    CLAY_SITE_HOST: host
  } = process.env,
  db = require('../../services/server/db'),
  moment = require('moment'),
  podcastUtils = require('../universal/podcast'),
  radioApiService = require('./radioApi'),
  stationUtils = require('./station-utils'),

  /**
   * Get all podcasts from the RDC API
   * @param {object} locals
   * @param {[object]} [collected]
   * @param {number} [page]
   * @returns {Promise<[object]>}
   */
  getPodcastsFromAPI = async (locals, collected = [], page = 1) => {
    const PAGE_SIZE = 900, // requesting 1000 items causes a 503 error, so request a little less than that
      params = {
        page: {
          size: PAGE_SIZE,
          number: page
        }
      },
      { data, links: { next } } = await radioApiService.get(
        'podcasts',
        params,
        null,
        { ttl: 0 }, // disable redis cache - it takes a long time, and we don't need to call this route very often.
        locals);

    return next
      ? getPodcastsFromAPI(locals, _concat(collected, data), page + 1)
      : _concat(collected, data);
  },

  /**
   * Fetch podcasts & station slug from API and store in DB
   * @param {object} locals
   */
  storePodcastsFromAPItoDB = async (locals) => {
    const podcasts = await getPodcastsFromAPI(locals),
      stationsById = await stationUtils.getAllStations.byId({ locals });

    if (podcasts.length) {
      const values = _flatten(podcasts.map(podcast => {
          const station = stationsById[podcastUtils.getStationIdForPodcast(podcast)],
            path = podcastUtils.createUrl(podcast, station),
            id = `${host}/_podcasts/${podcast.id}`;

          podcast.url = `${protocol}://${host}${path}`;
          podcast.updated = new Date().toISOString();

          return [id, podcast];
        })),
        insertSql = `
        INSERT INTO podcasts (id, data)
        VALUES
        ${'(?,?),'.repeat(values.length / 2).slice(0, -1)}
      `;

      await db.raw('DELETE FROM podcasts');
      await db.raw(insertSql, values);
    }
  },
  /**
   * Update the podcasts in db if they are a day old or not there
   * @param {object} locals
   */
  updatePodcasts = async (locals) => {
    const queryForOnePodcast = `
        SELECT id, data
        FROM podcasts
        ORDER BY data->>id
        LIMIT 1
      `,
      { rows: [podcastResult] } = await db.raw(queryForOnePodcast);

    // Check when podcasts were last updated
    // fetch from API & update DB if more than a day old or not in DB
    if (!podcastResult || moment().isAfter(podcastResult.data.updated, 'day')) {
      await storePodcastsFromAPItoDB(locals);
    }
  };

module.exports = {
  updatePodcasts
};
