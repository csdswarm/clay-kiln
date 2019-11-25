'use strict';

/**
 * this file holds stores exposed by shared components.  So far 'station-select'
 *   is the only such component.  The reason this file is necessary is that
 *   shared components will not have their stores registered by the time some
 *   consumers need it.  Specifically this was ocurring in alerts-main.vue where
 *   the watcher on 'selectedStation' was causing a "module namespace not
 *   found" error.
 */

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
