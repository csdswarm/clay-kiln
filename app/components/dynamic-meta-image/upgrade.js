'use strict';

/**
 * change localsKey to localsPath since 'path' is the term lodash employs
 *
 * note: data.localsKey should be removed in a later release since it is no
 *   longer used
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 **/
module.exports['1.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;

  return data;
};
