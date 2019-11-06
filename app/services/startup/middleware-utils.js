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
};

module.exports = {
  preventFastlyCache
};
