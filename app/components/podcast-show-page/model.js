'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get'),
  url = require('url'),
  qs = require('qs');
  // { autoLink } = require('../breadcrumbs');

/**
 * fetch podcast show data
 * @param {object} locals
 * @returns {Promise<object>}
 */
function getPodcastShow(locals) {
  const route = `podcasts/${ locals.params.dynamicSlug }`;

  return radioApiService.get(route, {}, null, {}, locals).then(response => {
    return response.data || {};
  });
}

/**
 * fetch episodes from a podcast show
 * @param {object} locals
 * @returns {Promise<array>}
 */
function getEpisodesInShow(locals) {
  const route = 'episodes',
    querystring = url.parse(locals.url).query,
    { sort = 'newest', page = 1 } = qs.parse(querystring),
    params = {
      'filter[podcast_id]': locals.podcast.id,
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

/**
 * fetch episodes from a podcast show
 * @param {object} locals
 * @returns {Promise<array>}
 */
function getPopularPodcasts(locals) {
  const route = 'podcasts',
    params = {
      'page[size]': 6,
      sort: '-popularity'
    };

  return radioApiService.get(route, params, null, {}, locals).then(response => {
    return response.data || [];
  });
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    // Stored in data for breadcrumbs component
    data.stationSlug = _get(locals, 'params.stationSlug');

    [locals.podcast, locals.trendingPodcasts] = await Promise.all( [
      getPodcastShow(locals),
      getPopularPodcasts(locals)
    ]);

    locals.episodes = await getEpisodesInShow(locals);

    data = {
      ...data,
      podcast: {
        ...locals.podcast,
        episodes: locals.episodes
      }
    };

    // @TODO breadcrumbs to be done in ON-446
    // autoLink(data, ['stationSlug', '{podcasts}', 'podcast.slug'], locals.site.host);
    return data;
  }
});
