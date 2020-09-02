'use strict';

const _get = require('lodash/get');

module.exports.render = async (ref, data, locals) => {
  if (!_get(locals, 'station.id')) {
    return data;
  }

  data.station = locals.station;

  return data;
};
