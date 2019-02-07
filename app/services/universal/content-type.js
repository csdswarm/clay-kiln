'use strict';

/**
 * return content type list from data
 *
 * @param {object} data
 * @returns {Promise}
 */
function parseFromData(data) {
  return Object.entries(data.contentType || {})
    .map(([type, isIncluded]) => isIncluded ? type : null)
    .filter((x) => x);
}

module.exports.parseFromData = parseFromData;
