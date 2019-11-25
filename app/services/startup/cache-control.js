'use strict';

const interceptor = require('express-interceptor'),
  cacheControlInterceptor = interceptor((req, res) => {
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
       * @param {string} body
       * @param {function} send
       */
      intercept(body, send) {
        res.set('Cache-Control', 'private, no-store');
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

module.exports = cacheControlInterceptor;
