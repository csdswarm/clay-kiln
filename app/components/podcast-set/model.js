'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  podcastService = require('../../services/universal/podcast'),
  log = require('../../services/universal/log').setup({ file: __filename });

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
      .then((response) => {
        let podcasts = [];

        if (response.data) {
          podcasts = response.data;
          for (let i = 0; i < podcasts.length; i++) {
            const podcast = podcasts[i];

            podcast.attributes.url = podcastService.createUrl(podcast.attributes.site_slug);
          }
        }

        data._computed.podcasts = podcasts;

        return data;
      }).catch((rejected) => {
        log('error', 'Error querying RDC API for podcast data:', { error: rejected });
        return data;
      });

  }
});
