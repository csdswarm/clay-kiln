'use strict';

const db = require('../server/db'),
  moment = require('moment'),
  log = require('../universal/log').setup({ file: __filename }),
  radioApiService = require('./radioApi'),
  {
    CLAY_SITE_PROTOCOL: protocol,
    CLAY_SITE_HOST: host
  } = process.env,
  getPodcastsFromAPI = async (podcastsFromAPI, pageNumber = 1) => {
    const route = 'podcasts',
      PAGE_SIZE = 10000,
      params = {
        'page[size]': PAGE_SIZE,
        'page[number]': pageNumber
      },
      { data, links: { next } } = await radioApiService.get(route, params, null, {});

    podcastsFromAPI = podcastsFromAPI.concat(data);
    if (next) {
      return await getPodcastsFromAPI(podcastsFromAPI, pageNumber + 1);
    } else {
      return podcastsFromAPI;
    }
  },
  /**
   * Fetch podcasts & station slug from API and store in DB
   */
  storePodcastsFromAPItoDB = async () => {
    const podcastsFromAPI = await getPodcastsFromAPI([]),
      { data: stationsFromAPI } = await radioApiService.get('stations', {
        'page[size]': 10000
      }, null, {});

    if (podcastsFromAPI.length) {
      const podcastsSQL = [],
        podcastsSQLValues = [];

      podcastsFromAPI.forEach(podcast => {
        let url = `${protocol}://${host}/podcasts/${podcast.attributes.site_slug}`;

        if (podcast.attributes.station.length) {
          const [{ id: stationID }] = podcast.attributes.station,
            stations = stationsFromAPI
              .filter(station => station.id === stationID);

          if (stations.length) {
            const [{ attributes: { site_slug: stationSiteSlug } }] = stations;

            url = `${protocol}://${host}/${stationSiteSlug}/podcasts/${podcast.attributes.site_slug}`;
          }
        }

        const id = `${host}/_podcasts/${podcast.id}`,
          updatedPodcast = {
            ...podcast,
            url,
            updated: new Date().toISOString()
          };

        podcastsSQL.push('(?, ?)');
        podcastsSQLValues.push(id);
        podcastsSQLValues.push(updatedPodcast);
      });
      await db.raw('DELETE FROM podcasts');
      await db.raw(`
        INSERT INTO podcasts (id, data)
        VALUES
        ${ podcastsSQL.join(',\n') }
      `, podcastsSQLValues);
    }
  },
  /**
   * Update the podcasts in db if they are a day old or not there
   */
  updatePodcasts = async () => {
    await db.ensureTableExists('podcasts');

    const queryForOnePodcast = `
        SELECT id, data
        FROM podcasts
        ORDER BY data->>id
        LIMIT 1
      `,
      { rows: podcastsResults } = await db.raw(queryForOnePodcast);

    // Check when podcasts were last updated
    // fetch from API & update DB if more than a day old or not in DB
    if (!podcastsResults.length || moment(new Date()).isAfter(podcastsResults[0].updated, 'day')) {
      await storePodcastsFromAPItoDB();
    }
  },
  /**
   * Add routes for podcasts
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    /**
     * Get the current podcasts
     */
    app.put('/_podcasts', checkAuth, async (req, res) => {
      try {
        await updatePodcasts();

        res.status(200).send('podcasts in DB refreshed');
      } catch (e) {
        log('error', e.message);
        res.status(500).send(`There was an error getting current podcasts: ${e.message}`);
      }
    });
  };

module.exports = {
  inject
};
