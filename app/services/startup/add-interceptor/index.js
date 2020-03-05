'use strict';

/**
 * README
 *  - see /add-interceptor under this middleware confluence doc for more info
 *    https://entercomdigitalservices.atlassian.net/wiki/spaces/UNITY/pages/365297987/Middleware
 */

module.exports = {
  cacheControl: require('./cache-control'),
  loadedIds: require('./loaded-ids')
};
