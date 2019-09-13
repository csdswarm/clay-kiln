'use strict';

const log = require('../../services/universal/log').setup({ file: __filename });

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) { // eslint-disable-line no-unused-vars
  if (typeof data.text !== 'string') {
    log('error', 'HTML Embed contains malformed data', { ref });

    data.text = '';
  }

  data.isIframe = data.text.indexOf('<iframe') !== -1;

  return data;
};
