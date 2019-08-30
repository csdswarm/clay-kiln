'use strict';

const log = require('../universal/log').setup({ file: __filename });

/**
 * Wraps middleware in a try catch which returns a 500 error in the case of
 *   an error.
 *
 * @param {function} middleware
 * @returns {function}
 */
module.exports.wrapInTryCatch = middleware => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (err) {
      log('error', 'error when ' + context, err);
      // should we include context in the response body ?
      res.status(500).end();
    }
  };
};
