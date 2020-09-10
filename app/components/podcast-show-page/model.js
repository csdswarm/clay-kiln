'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  radioApiService = require('../../services/server/radioApi'),
  { autoLink } = require('../breadcrumbs');

/**
 * add breadcrumbs data
 * @param {object} data
 * @param {object} locals
 * @returns {Promise<object>}
 */
async function addBreadcrumbs(data, locals) {
  if (!_isEmpty(locals.podcast) && locals.podcast.attributes) {
    const { site_slug, title } = locals.podcast.attributes;

    await autoLink(data, [
      { slug: 'podcasts', text: 'podcasts' },
      { slug: site_slug, text: title }
    ], locals);
  }
}

async function getPodcastShow(locals) {
  const route = 'podcasts';

  return await radioApiService.get(route, {
    'filter[site_slug]': locals.params.dynamicSlug
  }, null, {}, locals);
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    const podcast = await getPodcastShow(locals);

    // Setting data to be referenced on podcast lead
    locals.podcast = _get(podcast, 'data[0]');

    data.stationSlug = _get(locals, 'params.stationSlug');
    await addBreadcrumbs(data, locals);
    data._computed.podcastSiteSlug = locals.params.dynamicSlug;

    return data;
  }
});