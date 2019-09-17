'use strict';

/**
 * Wraps middleware in a try catch which passes the error onto the application's
 *   error handling middleware
 *   https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
 *
 * Note: This method is copied in the amphora-permissions plugin because that
 *   plugin should be isolated i.e. it should be treated as though it were a
 *   separate npm package.
 *
 * @param {function} middleware
 * @returns {function}
 */
module.exports.wrapInTryCatch = middleware => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (err) {
      if (!(err instanceof Error)) {
        err = new Error(err);
      }
      next(err);
    }
  };
};
