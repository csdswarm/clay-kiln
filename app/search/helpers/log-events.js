'use strict';

const log = require('../../services/universal/log').setup({ file: __filename });

/**
 * Log any error in a single format
 *
 * @param  {Error} err
 */
function logError(err) {
  log('error', err.message, { stack: err.stack });
}

/**
 * Log any success message in a single format
 *
 * @param  {String} index
 * @return {Function}
 */
function logSuccess(index) {
  return function (id) {
    log('debug', `Processed document ${id} for elastic index ${index}`);
  };
}

module.exports.logError = logError;
module.exports.logSuccess = logSuccess;
