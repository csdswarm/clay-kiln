'use strict';

const
  _concat = require('lodash/concat'),
  _flatten = require('lodash/flatten'),
  db = require('../../services/server/db'),
  log = require('../universal/log').setup({ file: __filename }),
  moment = require('moment'),
  podcastUtils = require('../universal/podcast'),
  radioApiService = require('./radioApi'),
  stationUtils = require('./station-utils'),
  {
    CLAY_SITE_PROTOCOL: protocol,
    CLAY_SITE_HOST: host
  } = process.env,

  PAGE_SIZE = 900, // requesting 1000 items causes a 503 error, so request a little less than that,

  __ = {
    dbRaw: db.raw,
    moment,
    radioApiGet: radioApiService.get,
    getStationsById: stationUtils.getAllStations.byId,
    log
  },


  /**
   * Get all podcasts from the RDC API
   * @param {object} locals
   * @returns {Promise<[object]>} A list of podcasts
   */
  getPodcastsFromAPI = async (locals) => {
    const
      { radioApiGet, log } = __,
      params = {
        page: {
          size: PAGE_SIZE,
          number: 1
        }
      };

    let
      next,
      collected = [];

    do {
      try {
        const
          { data, links } = await radioApiGet(
            'podcasts',
            params,
            null,
            { ttl: 0 }, // disable redis cache - it takes a long time, and we don't need to call this route very often.
            locals);

        next = links.next;
        params.page.number++;
        collected = _concat(collected,data);
      } catch (e) {
        next = false; // escape from do...while loop
        log('error', `Failed to get podcasts from RDC API - page number ${params.page.number}`, e);
      }
    } while (next);

    return collected;
  },

  /**
   * Fetch podcasts & station slug from API and store in DB
   * @param {object} locals
   */
  storePodcastsFromAPItoDB = async (locals) => {
    const
      { dbRaw, getStationsById, log, moment } = __,
      podcasts = await getPodcastsFromAPI(locals),
      stationsById = await getStationsById({ locals }),
      now = moment().toISOString();

    if (podcasts.length) {
      const values = _flatten(podcasts.map(podcast => {
          const station = stationsById[podcastUtils.getStationIdForPodcast(podcast)],
            path = podcastUtils.createUrl(podcast, station),
            id = `${host}/_podcasts/${podcast.id}`;

          podcast.url = `${protocol}://${host}${path}`;
          podcast.updated = now;

          return [id, podcast];
        })),
        insertSql = `
        INSERT INTO podcasts (id, data)
        VALUES
        ${'(?,?),'.repeat(values.length / 2).slice(0, -1)}
      `;

      try {
        await dbRaw('DELETE FROM podcasts');
        await dbRaw(insertSql, values);
      } catch (err) {
        log('error', `There was a problem updating database with podcast data. Values: ${values}`, err);
      }
    }
  },
  /**
   * Update the podcasts in db if they are a day old or not there
   * @param {object} locals
   */
  updatePodcasts = async (locals) => {
    const
      { dbRaw, moment, log } = __,
      queryForOnePodcast = `
        SELECT id, data
        FROM podcasts
        LIMIT 1
      `;

    try {
      const { rows: [podcastResult] } = await dbRaw(queryForOnePodcast);

      // Check when podcasts were last updated
      // fetch from API & update DB if more than a day old or not in DB
      if (!podcastResult || moment().isAfter(podcastResult.data.updated, 'day')) {
        await storePodcastsFromAPItoDB(locals);
      }
    } catch (e) {
      log('error', 'Failed to check for podcast data in db', e);
    }
  };

module.exports = {
  _internals: __,
  updatePodcasts
};
