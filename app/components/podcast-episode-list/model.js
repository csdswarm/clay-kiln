'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  format = require('date-fns/format'),
  addSeconds = require('date-fns/add_seconds'),
  parse = require('date-fns/parse'),
  _get = require('lodash/get'),
  radioApiService = require('../../services/server/radioApi'),
  { replaceWithString } = require('../../services/universal/sanitize'),
  { playingClass } = require('../../services/universal/spaLocals'),
  { loadMoreAmount } = require('./constants');

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
    {
      sort = 'newest',
      page = 1,
      'podcast-site-slug': podcastSiteSlug
    } = _get(locals, 'query', {}),
    params = {
      'filter[podcast_site_slug]': _get(locals, 'params.dynamicSlug') || podcastSiteSlug,
      'page[size]': loadMoreAmount,
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

  return radioApiService.get(route, params, null, {}, locals)
    .then(response => {

      if (locals.podcast) {
        return { ...response, data: response.data || [] };
      } else {
        return {
          ...response,
          ...getMissingPodcast(locals, podcastSiteSlug, response.data || [])
        };
      }
    });
}
/**
 * generates link for episode detail page
 *
 * National podcast episode URL structure:
 *  /podcasts/[podcast show title]/[podcast-episode-title]
 * Station podcast episode URL structure:
 *  /[site_slug]/podcasts/[podcast show title]/[podcast-episode-title]
 *
 * @param {object} episode - object containing episode data
 * @param {object} locals - data that has been attached to express locals for the current page request
 *
 * @returns {string}
 */
function buildEpisodeDetailLink(episode, locals) {
  const {
      'station-site-slug': stationSiteSlug,
      'podcast-site-slug': podcastSiteSlug
    } = _get(locals, 'query', {}),
    station = stationSiteSlug || _get(locals, 'params.stationSlug'),
    podcast = podcastSiteSlug || _get(locals, 'params.dynamicSlug');
  let url = '';

  if (station) {
    url += `/${station}`;
  }
  url += `/podcasts/${podcast}/${episode.attributes.site_slug}`;

  return url;
}

/**
 * since async call doesn't have locals.podcast this will populate if needed
 *
 * @param {object} locals
 * @param {string} podcastSiteSlug
 * @param {array} episodes
 * @returns {array}
 */
function getMissingPodcast(locals, podcastSiteSlug, episodes) {
  return radioApiService
    .get('podcasts', { 'filter[site_slug]': _get(locals, 'params.dynamicSlug') || podcastSiteSlug }, null, {}, locals)
    .then(response => {
      locals.podcast = _get(response, 'data[0]', {});
      return episodes;
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
    if (!locals) {
      return data;
    }

    const { data: episodes, meta: { count: episodeCount } } = await getEpisodesInShow(locals),
      PODCAST_FALLBACK_IMAGE = _get(locals, 'podcast.attributes.image', '');

    data._computed.showEpisodeBtn = episodeCount > loadMoreAmount;
    data._computed.episodes = episodes.map(episodeData => {
      const startOfDay = new Date(0),
        { attributes } = episodeData,
        durationInSeconds = parseFloat(attributes.duration_seconds),
        replacePatterns = [/[\n\r]/g, /<.*?>/g];

      attributes.description = attributes.description ? replaceWithString(attributes.description, replacePatterns, '') : '';
      // NOTE: using snake case to stay consistent with api schema
      attributes.image_url = attributes.image_url || PODCAST_FALLBACK_IMAGE; // Use this as a fallback when episodes do not have his own image.
      attributes.is_image_url_omny = isImageOmny(attributes.image_url);
      attributes.published_date_formatted = format(
        parse(attributes.published_date),
        'MMMM DD, YYYY'
      );
      attributes.duration_seconds_formatted = durationInSeconds ? format(
        addSeconds(startOfDay, durationInSeconds),
        getDurationFormat(durationInSeconds)
      ) : null;

      attributes.episode_detail_url = buildEpisodeDetailLink(episodeData, locals);

      // need to get the playing class on each episode in list for ON-1961
      attributes.playing_class = playingClass(locals, episodeData.id);

      return episodeData;
    });
    // adding dynamic slug to get to the client js
    data._computed.podcastSiteSlug = _get(locals, 'params.dynamicSlug', undefined);
    data._computed.stationSiteSlug = _get(locals, 'params.stationSlug', undefined);

    // enable the load more button if it is > 0 and can be evenly divided by 20 as a remainder would signify the end
    data._computed.loadMoreEnabled = data._computed.episodes.length > 0 && data._computed.episodes.length % 20 === 0;
    return data;
  }
});
