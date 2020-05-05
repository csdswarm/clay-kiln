'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  format = require('date-fns/format'),
  _get = require('lodash/get'),
  addSeconds = require('date-fns/add_seconds'),
  parse = require('date-fns/parse'),
  radioApiService = require('../../services/server/radioApi');

/**
 * returns a boolean for if the media is from omny
 *
 * @param {string} url - the url for the media
 *
 * @returns {boolean}
 */
function isImageOmny(url) {
  return url.includes('omnycontent');
}

/**
 * returns a format string to be used with date fns
 *
 * @param {string} durationInSeconds - the duration in second from the api
 *
 * @returns {string}
 */
function getDurationFormat(durationInSeconds) {
  if (durationInSeconds < 60) {
    return 's [s]ec';
  }
  if (durationInSeconds >= 3660) {
    return 'H [h]r m [m]in';
  }
  if (durationInSeconds < 3660 && durationInSeconds >= 3600) {
    return 'H [h]r';
  }
  return 'm [m]in';
}

/**
 * fetch episodes from a podcast show
 * url params:
 * sort=newest, sort=oldest
 * page={page number}
 * 20 results per page
 *
 * @param {object} locals
 * @returns {Promise<array>}
 */
function getEpisodesInShow(locals) {
  const route = 'episodes',
    { sort = 'newest', page = 1 } = locals.query,
    params = {
      'filter[podcast_site_slug]': locals.params.dynamicSlug,
      'page[size]': 20,
      'page[number]': page
    };

  switch (sort) {
    case 'oldest':
      params.sort = 'published_date';
      break;
    case 'newest':
    default:
      params.sort = '-published_date';
  };

  return radioApiService.get(route, params, null, {}, locals).then(response => {
    return response.data || [];
  });
}

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
    if (!locals || !locals.params) {
      return data;
    }

    const episodes = await getEpisodesInShow(locals),
      EPISODE_FALLBACK_IMAGE = _get(locals, 'podcast.attributes.image', '');

    data._computed.episodes = episodes.map(episodeData => {
      const startOfDay = new Date(0),
        { attributes } = episodeData,
        durationInSeconds = parseFloat(attributes.duration_seconds);

      // NOTE: using snake case to stay consistent with api schema
      attributes.image_url = attributes.image_url || EPISODE_FALLBACK_IMAGE; // Use this as a fallback when episodes do not have his own image.
      attributes.is_image_url_omny = isImageOmny(attributes.image_url);
      attributes.published_date_formatted = format(
        parse(attributes.published_date),
        'MMMM DD, YYYY'
      );
      attributes.duration_seconds_formatted = format(
        addSeconds(startOfDay, durationInSeconds),
        getDurationFormat(durationInSeconds)
      );

      return episodeData;
    });
    // enable the load more button if it is > 0 and can be evenly divided by 20 as a remainder would signify the end
    data._computed.loadMoreEnabled = data._computed.episodes.length > 0 && data._computed.episodes.length % 20 === 0;
    return data;
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
  save: (uri, data) => {
    return data;
  }
});
