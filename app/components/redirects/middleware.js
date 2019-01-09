'use strict';

const db = require('../../services/server/db'),
  redirectDataURL = '/_components/redirects/instances/default@published',
  /**
   * converts a string into a regular expression * as a wildcard
   *
   * @param {string} url
   * @returns {RegExp}
   */
  createRegExp = (url) => {
    let regExp = url.replace(/\*/g, '.*');

    return new RegExp(`^${regExp}$`, 'i');
  },
  /**
   * determines if a url is inside an array of redirect objects
   *
   * @param {string} url
   * @param {object} req
   * @returns {boolean}
   */
  testURL = (url, req) => createRegExp(url).test(`${req.protocol}://${req.hostname}${req.originalUrl}`);

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  try {
    const redirects = (await db.get(`${req.hostname}${redirectDataURL}`)).redirects;

    if (redirects && redirects.some(item => testURL(item.url, req))) {
      res.redirect(redirects.filter(item => testURL(item.url, req))[0].redirect);
    }
  } catch (e) {
  }
  next();
};
