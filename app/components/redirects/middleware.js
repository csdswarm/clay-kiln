'use strict';

const db = require('../../services/server/db'),
  redirectDataURL = '/_components/redirects/instances/cjqmk4cwl000e3g5vw4803tzd',
  /**
   * converts a string into a regular expression * as a wildcard
   *
   * @param {string} url
   * @returns {RegExp}
   */
  convertRegExp = (url) => {
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
  testURL = (url, req) => convertRegExp(url).test(`${req.protocol}://${req.hostname}${req.originalUrl}`);

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = async (req, res) => {
  try {
    const redirects = (await db.get(`${req.hostname}${redirectDataURL}`)).redirects || [];

    if (redirects.some(item => testURL(item.url, req))) {
      res.redirect(redirects.filter(item => testURL(item.url, req))[0].redirect);
    }
  } catch (e) {
    console.log('SADNess!!!', e);
  }
};
