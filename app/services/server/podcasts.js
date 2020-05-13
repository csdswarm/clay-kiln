'use strict';

const db = require('../server/db'),
  moment = require('moment'),
  log = require('../universal/log').setup({ file: __filename }),
  radioApiService = require('./radioApi'),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(({ id, data }) => ({ id, ...data })),
  /**
   * Get all podcasts from Radio API and store in DB daily
   *
   * @returns {Promise<Array<Object>>}
   */
  storePodcastsFromAPItoDB = async () => {
    const route = 'podcasts',
      params = {
        'page[size]': 50000
      },
      podcastsFromAPI = radioApiService.get(route, params, null, {}).then(response => {
        return response.data || [];
      });

    console.log('get podcasts from API:', podcastsFromAPI);
    if (podcastsFromAPI.length) {
      const podcastsSQL = podcastsFromAPI.map(podcast => {
        const id = `${CLAY_SITE_HOST}/_podcasts/${podcast.id}`,
          updatedPodcast = { ...podcast, updated: new Date().toISOString() };

        return `VALUES (${ id }, ${ updatedPodcast })`;
      }).join(',');

      console.log('podcastsSQL:', podcastsSQL);
      await db.ensureTableExists('podcasts');
      const insertResults = await db.raw(`
        INSERT INTO podcasts (id, data)
        ${ podcastsSQL }
      `);

      console.log('results of inserting multiple', insertResults);
      return insertResults;
    }
  },
  /**
   * Get the current podcasts directly from the db
   */
  getPodcasts = async () => {
    await db.ensureTableExists('podcasts');

    const queryForOnePodcast = `
        SELECT id, data
        FROM podcasts
        ORDER BY data->>id
        LIMIT 1
      `,
      { rows: podcastsResults } = db.raw(queryForOnePodcast)
        .then(pullDataFromResponse);

    console.log('get one podcast from DB:', podcastsResults);

    // Check when podcasts were last updated
    // fetch from API & update DB if more than a day old or not in DB
    if (!podcastsResults.length || moment(new Date()).isAfter(podcastsResults[0].updated, 'day')) {
      console.log('podcast does not exist in DB or is more than a day old');
      return storePodcastsFromAPItoDB();
    }

    const queryForAllPodcasts = `
      SELECT id, data
      FROM podcasts
      ORDER BY data->>id
    `;

    console.log('get all podcasts from DB existing');
    return db.raw(queryForAllPodcasts)
      .then(pullDataFromResponse);
  },
  /**
   * Add routes for podcasts
   *
   * @param {object} app
   */
  inject = (app) => {
    /**
     * Get the current podcasts
     */
    app.get('/_podcasts', async (req, res) => {
      try {
        const { rows: podcasts } = await getPodcasts();

        res.status(200).send(podcasts);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error getting current podcasts');
      }
    });
  };

module.exports = {
  getPodcasts,
  inject
};
