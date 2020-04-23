'use strict';

const { preventFastlyCache } = require('../middleware-utils'),
  logger = require('../../universal/logger');

const interceptor = require('express-interceptor'),
  cacheControlInterceptor = interceptor((req, res) => {
    logger(module, req, 'startAt');
    return {
      /**
       * Returns whether a request should be intercepted or not
       * @returns {boolean}
       */
      isInterceptable() {
        return shouldPassCache(req, res);
      },
      /**
       * The interception happens here, after all other middleware. res can be altered before the response is actually sent.
       * @param {*} body
       * @param {function} send
       */
      intercept(body, send) {
        preventFastlyCache(res);
        logger(module, req, 'endAt');
        send(body);
      }
    };
  }),
  /**
   * Decides whether a request/response should pass Fastly and browser caches
   * @param {ClientRequest} req
   * @param {ServerResponse} res
   * @return {boolean}
   */
  shouldPassCache = (req, res) => {
    const headers = res.getHeaders();

    // if we are being redirected to the login page, don't cache. prevents login loop
    return headers.location && headers.location.endsWith('/_auth/login');
  };

/**
 * @param {object} app - the express app
 */
module.exports = app => {
  app.use(cacheControlInterceptor);
};
