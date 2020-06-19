'use strict';

const db = require('../../services/server/db'),
  moment = require('moment'),
  radioApiService = require('../../services/server/radioApi'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
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
        let url = `${protocol}://${host}/podcasts/${podcast.attributes.site_slug}`,
          stations = [];

        if (podcast.attributes.station.length) {
          const [{ id: stationID }] = podcast.attributes.station;
            
          stations = stationsFromAPI
            .filter(station => station.id === stationID);
        }
        if (stations.length) {
          const [{ attributes: { site_slug: stationSiteSlug } }] = stations;

          url = `${protocol}://${host}/${stationSiteSlug}/podcasts/${podcast.attributes.site_slug}`;
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
  };


/**
 * adds the POST '/update-podcasts-sitemap' endpoint
 *
 * this authenticated endpoint updates podcasts stored in DB
 *
 * @param {object} router
 * @param {function} checkAuth
 */
module.exports = (router, checkAuth) => {
  router.post('/update-podcasts-sitemap', checkAuth, wrapInTryCatch(async (req, res) => {
    await updatePodcasts();
    res.status(200).send('podcasts in DB refreshed');
  }));
};
