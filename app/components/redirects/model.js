'use strict';



const
  /**
   * determines if a urlString is valid by comparing to defined routes
   *
   * @param {string} urlString
   * @returns {boolean}
   */
  validPath = (urlString) => {
    const blockedPaths = [
        '/',
        '/blogs',
        '/articles',
        '/article',
        '/topic',
        '/music',
        '/news',
        '/sports',
        '/authors',
        '/newsletter/subscribe',
        '/js/.*',
        '/css/.*',
        '/fonts/.*',
        '/media/.*',
        '/_.*',
        '/404'
      ],
      path = `/${urlString.split('/').splice(3).join('/')}`;

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

  // do not allow any redirects that are direct preset routes
  data.redirects = data.redirects.filter(redirect => validPath(redirect.url));

  return Promise.resolve(data);
};

