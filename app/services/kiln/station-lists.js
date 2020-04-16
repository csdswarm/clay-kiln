'use strict';

const
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  { postfix } = require('../universal/utils'),
  { STATION_LISTS } = require('../universal/constants'),
  
  __ = {
    beforeMount() {
      const currentList = _get(this, 'args.list', ''),
        stationPrefix = STATION_LISTS[currentList] ? postfix(_get(window, 'kiln.locals.station.site_slug'), '-') : '',
        stationList = `${stationPrefix}${currentList}`;

      _set(this, 'args.list', stationList);
    }
  };

function addStationCheckToSelect() {
  const select = _get(window, 'kiln.inputs.input-select', {});

  select.beforeMount = __.beforeMount;
}

module.exports = {
  _internals: __,
  addStationCheckToSelect
};
