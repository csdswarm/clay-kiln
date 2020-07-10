'use strict';

const axios = require('axios');

module.exports = async (data, locals) => {
  // we're only covering national content for now
  if (data.stationSlug) {
    return [];
  }

  const { data: stations } = await axios.post(
    '/rdc/get-stations-subscribed-to-content',
    { data, locals }
  );

  return stations;
};
