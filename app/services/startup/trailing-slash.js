'use strict';

const log = require('../universal/log').setup({file: __filename}),
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
 */
module.exports = (req, res, next) => {
  try {
    if (req.path.endsWith('/') && req.path !== '/') {
      const urlWithoutTrailingSlash = req.originalUrl.replace(lastSlashInString, '');

      return res.redirect(urlWithoutTrailingSlash);
    }
  } catch (e) {
    log('Error processing trailing slash', e);
  }
  next();
};
