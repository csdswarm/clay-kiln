'use strict';

const _concat = require('lodash/concat'),
  {
    CLAY_SITE_PROTOCOL: protocol,
    CLAY_SITE_HOST: host
  } = process.env,
  db = require('../../services/server/db'),
  moment = require('moment'),
  radioApiService = require('./radioApi'),

  getPodcastsFromAPI = async (collected = [], page = 1) => {
    const PAGE_SIZE = 900, // requesting 1000 items causes a 503 error, so request a little less than that
      params = {
        page:{
          size:PAGE_SIZE,
          number:page
        }
      },
      { data, links: { next } } = await radioApiService.get('podcasts', params, null, {});

    return next ?
      getPodcastsFromAPI(_concat(collected, data), page + 1) :
      _concat(collected, data);
  },
  /**
   * Fetch podcasts & station slug from API and store in DB
   */

  storePodcastsFromAPItoDB = async () => {
    const podcastsFromAPI = await getPodcastsFromAPI(),
      // @TODO use getAllStations.byId after merging in 1637
      { data: stationsFromAPI } = await radioApiService.get('stations', {
        'page[size]': 10000
      }, null, {});

    if (podcastsFromAPI.length) {
      const podcastsSQL = [],
        podcastsSQLValues = [];

      podcastsFromAPI.forEach(podcast => {
        // @TODO: use the createUrl() function that was updated in ON-1637 to generate this URL
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

module.exports = {
  updatePodcasts
};
