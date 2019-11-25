'use strict';

const _set = require('lodash/set'),
  stationSelect = require('../shared-vue-components/station-select'),
  storeModules = [stationSelect];

module.exports = () => {
  _set(window, 'kiln.plugins.stores', rootStore => {
    storeModules.forEach(({ store, storeNs }) => {
      rootStore.registerModule(storeNs, store);
    });
  });
};
