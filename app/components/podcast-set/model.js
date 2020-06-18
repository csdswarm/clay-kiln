'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  podcastService = require('../../services/universal/podcast'),
  radioApiService = require('../../services/server/radioApi'),
  stationUtils = require('../../services/client/station-utils'),
  _get = require('lodash/get');

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

          const stationIds = podcasts.map((podcast) => {
              return _get(podcast, 'attributes.station[0].id');
            }).filter(item => !!item),

            stationsData = await stationUtils.getStationsById(stationIds);

          podcasts.forEach((podcast) => {

            const stationId = _get(podcast, 'attributes.station[0].id', null),
              station = stationsData.find((station)=>station.id === stationId),
              stationSlug = _get(station, 'site_slug', null);

            podcast.attributes.url = podcastService.createUrl(podcast.attributes.site_slug, stationSlug);
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
