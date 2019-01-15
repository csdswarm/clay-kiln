'use strict';

/**
 * determines if a urlString is valid by comparing to defined routes
 *
 * @param {string} urlString
 * @param {object} blockedPaths
 * @returns {boolean}
 */
const validPath = (urlString, blockedPaths) => {
  const path = `/${urlString.split('/').splice(3).join('/')}`;

  return !blockedPaths.some(route => (new RegExp(`^${route}$`, 'i')).test(path));
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = (ref, data, locals) => {
  if (!locals.user.auth.includes('admin')) {
    return Promise.resolve(data);
  }

  const cleanRoutes = [ ...locals.routes.map(route => route.replace(/\/:.+/, '')),
      ...['/js/.*', '/css/.*', '/fonts/.*', '/media/.*', '/_.*', '/404'] ],
    blockedPaths = Array.from(new Set(cleanRoutes));

  // do not allow any redirects that are direct preset routes
  data.redirects = data.redirects.filter(redirect => validPath(redirect.url, blockedPaths));

  return Promise.resolve(data);
};

