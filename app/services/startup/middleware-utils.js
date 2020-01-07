'use strict';

/**
 * Adds headers to prevent fastly from caching the response.
 *
 * 'private' means fastly won't cache it
 * 'no-store' means the browser won't cache it
 * For more info:
 *   https://docs.fastly.com/en/guides/cache-control-tutorial#do-not-cache
 *
 * Keep in mind fastly should only be caching GET requests, so don't use this
 *   function on other http methods.
 *
 * @param {object} res - express response
 */
const preventFastlyCache = res => {
    res.set('Cache-Control', 'private, no-store');
  },
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
  wrapInTryCatch = middleware => {
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

module.exports = {
  preventFastlyCache,
  wrapInTryCatch
};
