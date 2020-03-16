'use strict';

/**
 * Wraps middleware in a try catch which passes the error onto the application's
 *   error handling middleware
 *   https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
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

/**
 * Applies the middleware to the path for all unsafe methods
 *
 * @param {object} router
 * @param {string} path
 * @param {function} middleware
 */
module.exports.addMiddlewareToUnsafeMethods = (router, path, middleware) => {
  router.put(path, middleware);
  router.post(path, middleware);
  router.patch(path, middleware);
  router.delete(path, middleware);
};

/**
 *  determines if the user is an actual user and not a robot
 * @param {object} locals
 * @param {object} locals.user
 *
 * @return {boolean}
 */
module.exports.isEditor = ({ user }) => !!(user && user.username);
