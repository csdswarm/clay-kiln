'use strict';
const axios = require("../../app/node_modules/axios");
const url = "https://api.radio.com/v1/stations?page[size]=1000";

/**
 * @returns {Array}
 */
async function getAllStations() {
  const stations = await axios(url);
  return stations.data;
}

module.exports = {
    getAllStations
};
