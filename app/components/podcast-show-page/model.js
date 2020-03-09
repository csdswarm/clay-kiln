'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get');
  // { autoLink } = require('../breadcrumbs');

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

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    // Stored in data for breadcrumbs component
    data.stationSlug = _get(locals, 'params.stationSlug');

    locals.podcast = await getPodcastShow(locals);

    // @TODO breadcrumbs to be done in ON-446
    // autoLink(data, ['stationSlug', '{podcasts}', 'podcast.slug'], locals.site.host);
    return data;
  }
});
