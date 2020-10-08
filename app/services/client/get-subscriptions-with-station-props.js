'use strict';

const axios = require('axios');

module.exports = async (data, locals) => {
  const { data: stations } = await axios.post(
    '/rdc/get-subscriptions-with-station-props',
    { data, locals }
  );

  return stations;
};
