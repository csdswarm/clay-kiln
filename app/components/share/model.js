'use strict';
const _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  return {
    ...data,
    domain: _get(locals, 'site.host'),
    stationCallSign: _get(locals, 'station.callsign')
  };
};
