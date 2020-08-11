'use strict';
const axios = require("../../app/node_modules/axios");
const _get = require("lodash/get");
const url = "https://api.radio.com/v1/stations?filter[site_slug]=";

/**
 * @returns {Object}
 */
async function getStationBySiteSlug_v1(site_slug) {
  const { data } = await axios(url + site_slug);
  return _get(data, 'data[0].attributes', {});
}

module.exports = {
    getStationBySiteSlug_v1
};
