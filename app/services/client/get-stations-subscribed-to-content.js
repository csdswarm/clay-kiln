'use strict';

const axios = require('axios');

module.exports = async (data, locals) => {
  const { data: stations } = await axios.post(
    '/rdc/get-stations-subscribed-to-content',
    { data, locals }
  );

  return stations;
};
