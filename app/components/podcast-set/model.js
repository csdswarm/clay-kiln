'use strict';

const {unityComponent} = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  podcastService = require('../../services/universal/podcast');

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
    console.log('Render podcast-set...',uri);
    // console.log('locals:',locals);
    // console.log('data:',data);
    const route = 'podcasts',
      // get podcast IDs
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

            podcast.attributes.url = podcastService.createUrl(podcast.attributes.title);
          }
        } else {
          console.log('RDC API no response data.');
        }

        data._computed.podcasts = podcasts;

        return data;
      }).catch((rejected) => {
        console.log('Error querying RDC API for podcast data:', rejected);

        return data;
      });

  },

  /**
   * Makes any necessary modifications to data just prior to persisting it
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  save: (uri, data, locals) => {
    return data;
  }
});
