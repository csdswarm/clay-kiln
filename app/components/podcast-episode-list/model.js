'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  format = require('date-fns/format'),
  addSeconds = require('date-fns/add_seconds'),
  parse = require('date-fns/parse'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get');

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
    { sort = 'newest',
      page = 1,
      'podcast-site-slug': podcastSiteSlug
    } = locals.query,
    params = {
      'filter[podcast_site_slug]': _get(locals, 'params.dynamicSlug') || podcastSiteSlug,
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
// NOTE: do js doc
function buildEpisodeDetailLink(episode, locals) {
  const {
      site: { host, protocol },
      query: {
        'station-site-slug': stationSiteSlug,
        'podcast-site-slug': podcastSiteSlug
      }
    } = locals,
    station = stationSiteSlug || _get(locals, 'params.stationSlug'),
    podcast = podcastSiteSlug || _get(locals, 'params.dynamicSlug');
  let url = `${protocol}://${host}`;

  if (station) {
    url += `/${station}`;
  }
  url += `/podcasts/${podcast}/${episode.attributes.site_slug}`;

  return url;
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
    if (!locals || !locals.query) {
      return data;
    }

    const episodes = await getEpisodesInShow(locals);

    data._computed.episodes = episodes.map(episodeData => {
      const startOfDay = new Date(0),
        { attributes } = episodeData,
        durationInSeconds = parseFloat(attributes.duration_seconds);

      // NOTE: using snake case to stay consistent with api schema
      attributes.is_image_url_omny = isImageOmny(attributes.image_url);
      attributes.published_date_formatted = format(
        parse(attributes.published_date),
        'MMMM DD, YYYY'
      );
      attributes.duration_seconds_formatted = format(
        addSeconds(startOfDay, durationInSeconds),
        getDurationFormat(durationInSeconds)
      );

      attributes.episode_detail_url = buildEpisodeDetailLink(episodeData, locals);

      return episodeData;
    });
    // adding dynamic slug to get to the client js
    data._computed.podcastSiteSlug = _get(locals, 'params.dynamicSlug', undefined);
    data._computed.stationSiteSlug = _get(locals, 'params.stationSlug', undefined);

    return data;
  }
});
