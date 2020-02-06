'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get'),
  { autoLink } = require('../breadcrumbs');

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
 * @param {String} [sort]
 * @param {number} [page]
 * @returns {Promise<array>}
 */
function getEpisodesInShow(locals, sort = 'newest', page = 1) {
  const route = 'episodes',
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
      console.log('no locals or params');
      return data;
    }
    console.log('locals url', locals.url);

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

    console.log('podcast', locals.podcast);
    console.log('locals url', locals.url);
    console.log('trending', locals.trendingPodcasts);

    // @TODO breadcrumbs to be done in ON-446
    // autoLink(data, ['stationSlug', '{podcasts}', 'podcast.slug'], locals.site.host);
    return data;
  }
});
