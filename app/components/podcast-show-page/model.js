'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  radioApiService = require('../../services/server/radioApi'),
  _get = require('lodash/get'),
  { autoLink, addCrumb } = require('../breadcrumbs');

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
  await autoLink(data, ['stationSlug'], locals);
  const url = `//${ locals.site.host }${ data.stationSlug ? `/${ data.stationSlug }/` : '' }/podcasts`;

  addCrumb(data, url, 'podcasts');

  if (locals.podcast.attributes) {
    const { site_slug, title } = locals.podcast.attributes;

    addCrumb(data, site_slug, title);
  }
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (!locals || !locals.params) {
      return data;
    }

    locals.podcast = await getPodcastShow(locals);
    data.stationSlug = _get(locals, 'params.stationSlug');
    await addBreadcrumbs(data, locals);

    data._computed = {
      podcastSiteSlug: locals.params.dynamicSlug,
      podcastCategorySlug: _get(locals.podcast, 'attributes.category[0].slug')
    };

    return data;
  }
});
