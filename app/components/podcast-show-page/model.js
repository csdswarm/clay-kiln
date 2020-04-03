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
  const route = `podcasts?filter[site_slug]=${ locals.params.dynamicSlug }`;

  return radioApiService.get(route, {}, null, {}, locals).then(response => {
    return response.data[0] || {};
  });
}

/**
 * add breadcrumbs data
 * @param {object} data
 * @param {object} locals
 * @returns {Promise<object>}
 */
async function addBreadcrumbs(data, locals) {
  if (locals.podcast.attributes) {
    const { site_slug, title, station } = locals.podcast.attributes;

    await autoLink(data, [
      { slug: data.stationSlug, text: station.length ? station[0].name : null },
      { slug: 'podcasts', text: 'podcasts' },
      { slug: site_slug, text: title }
    ], locals);
  }
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    data.stationSlug = _get(locals, 'params.stationSlug');
    locals.podcast = await getPodcastShow(locals);
    await addBreadcrumbs(data, locals);

    return data;
  }
});
