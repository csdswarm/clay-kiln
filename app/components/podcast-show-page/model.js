'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  { autoLink } = require('../breadcrumbs');

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
    await addBreadcrumbs(data, locals);

    return data;
  }
});
