'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  podcastUtils = require('../../services/universal/podcast'),
  radioApiService = require('../../services/server/radioApi');

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: async (uri, data, locals) => {
    const route = 'podcasts',
      { podcastIds } = locals,
      params = {
        'filter[id]': podcastIds
      };

    if (!podcastIds) {
      data._computed.podcasts = [];
      return data;
    }

    return radioApiService.get(route, params, null, {}, locals)
      .then(async (response) => {
        let podcasts = [];

        if (response.data) {
          podcasts = response.data;

          const stationsById = await podcastUtils.getStationsForPodcasts(podcasts,locals);

          podcasts.forEach((podcast) => {
            podcast.attributes.url = podcastUtils.createUrl(podcast, stationsById[podcastUtils.getStationIdForPodcast(podcast)]);
          });
        }

        data._computed.podcasts = podcasts;

        return data;
      }).catch((rejected) => {
        log('error', 'Error querying RDC API for podcast data:', { error: rejected });
        return data;
      });

  }
});
