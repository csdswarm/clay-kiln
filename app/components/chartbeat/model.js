'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get');

module.exports = unityComponent({
  render: function (ref, data, locals) {
    data._computed = {
      name: locals.station.name,
      market: locals.station.market.display_name ? locals.station.market.display_name.replace(',', '') : '',
      callsign: locals.station.callsign,
      genre: _get(locals.station.genre, ['0', 'name'], ''),
      category: locals.station.category
    };
    return data;
  }
});
