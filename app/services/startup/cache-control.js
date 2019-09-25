'use strict';

const interceptor = require('express-interceptor'),
  cacheControlInterceptor = interceptor((req, res) => {
    return {
      isInterceptable: () => {
        return shouldPassCache(req, res);
      },
      intercept: (body, send) => {
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
