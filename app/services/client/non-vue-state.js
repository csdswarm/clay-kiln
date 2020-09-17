'use strict';

/**
 * see commit message for the purpose of this file
 */

const _get = require('lodash/get'),
  _uniq = require('lodash/uniq');

const initialLoadedIds = window.spaPayload
    ? _get(JSON.parse(atob(window.spaPayload)), 'locals.loadedIds')
    // window.spaPayload doesn't exist in edit mode, and loadedIds aren't
    //   important then
    : [],
  state = { loadedIds: initialLoadedIds };

// fired in LayoutRouter.vue before and after spa navigation
document.addEventListener('set-loaded-ids', ({ loadedIds }) => {
  setLoadedIds(loadedIds);
});

/**
 * returns state.loadedIds
 * @returns {string[]}
 */
function getLoadedIds() {
  return state.loadedIds;
}

/**
 * Assigns state.loadedIds while removing duplicates and sorting the array
 *
 * @param {string[]} loadedIds
 */
function setLoadedIds(loadedIds) {
  state.loadedIds = _uniq(loadedIds).sort();
}

module.exports = { getLoadedIds, setLoadedIds };
