'use strict';

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) { // eslint-disable-line no-unused-vars
  data.isIframe = data.text.indexOf('<iframe') !== -1;

  return data;
};
