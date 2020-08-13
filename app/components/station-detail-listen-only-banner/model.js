'use strict';

const
  // _get = require('lodash/get'),
  rest = require('../../services/universal/rest.js'),
  { unityComponent } = require('../../services/universal/amphora');

/**
 * Page model render
 *
 * @param {string} ref url
 * @param {object} data persistence data for the control
 * @param {object} locals data
 * @returns {object} - data
 */
module.exports = unityComponent({
  render: async (uri, data, locals) => {
    const { site, station } = locals,
      { prefix, protocol } = site,
      { site_slug } = station;

    // NOTE: this get will be replaced soon after once the list is added to
    // locals instead in an upcoming fast-follow story
    await rest.get(`${protocol}://${prefix}/_lists/listen-only-station-style`)
      .then(list => {
        data._computed.styleInfo = list.find(item => item.siteSlug === site_slug);
      });

    return data;
  }
});
