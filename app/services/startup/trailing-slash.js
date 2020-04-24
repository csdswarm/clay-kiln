'use strict';

const log = require('../universal/log').setup({ file: __filename }),
  lastSlashInString = /\/(?=[^\/]*?$)/;

/**
 * Middleware to check to see if the end of the path has a trailing slash and if it does, it redirects to the same
 * page without the trailing slash
 * @param {Request} req
 * @param {Response} res
 * @param {function} next
 * @returns {*}
 * @example
 * Will redirect
 * * "/xyz/" to "/xyz"
 * * "/xyz/123/" to "/xyz/123"
 * * "/xyz/?someQuery=true" to "/xyz?someQuery=true"
 *
 * Will not redirect
 * * "_pages/xyz/"
 * NOTE:
 *   - reason for this, is that when editing, some urls
 *   are called with and expect to see the trailing slash.
 *   Assumption is that these will always have a /_ in them (e.g. /_components,
 *   /_pages, /_layouts, etc) - CSD
 */

module.exports = (req, res, next) => {
  try {
    const { path, originalUrl } = req;

    if (path.endsWith('/') && path.toString() !== '/' && !path.includes('/_')) {
      const urlWithoutTrailingSlash = originalUrl.replace(lastSlashInString, '');

      return res.redirect(urlWithoutTrailingSlash);
    }
  } catch (e) {
    log('Error processing trailing slash', e);
  }
  next();
};
