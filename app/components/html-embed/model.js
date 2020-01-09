'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  getBadSources = require('../../services/universal/get-bad-sources'),
  { SERVER_SIDE } = require('../../services/universal/constants');



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

/**
 * @param {string} ref
 * @param {Object} data
 * @param {Object} locals
 *
 * @returns {Object}
 */
module.exports.save = async function (ref, data, locals) {
  // server side only check so user can get validation error from ui
  if (SERVER_SIDE) {
    const hasBadSources = (await getBadSources(data.text, locals)).length;

    if (hasBadSources) {
      // remove the embed text since there was bad sources in the script tag
      data.text = '';
    }
  }

  return data;
};
