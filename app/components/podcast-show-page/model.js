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

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    data.stationSlug = _get(locals, 'params.stationSlug');
    locals.podcast = await getPodcastShow(locals);
    autoLink(data, ['stationSlug', '{podcasts}', `{${ locals.params.dynamicSlug }}`], locals.site.host);

    return data;
  }
});
