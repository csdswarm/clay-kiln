'use strict';
const branchIoKey = process.env.BRANCH_IO_KEY,
  _get = require('lodash/get');

module.exports.render = function (ref, data, locals) {
  return {
    ...data,
    branchIoKey,
    player_site_genre: _get(locals, 'station.genre'),
    station_logo: _get(locals, 'station.square_logo_small'),
    player_site_category: _get(locals, 'station.category'),
    player_site_market: _get(locals, 'station.market.display_name'),
    page: 'station-detail',
    station_name: _get(locals, 'station.name'),
    station_id: _get(locals, 'station.id')
  };
};
