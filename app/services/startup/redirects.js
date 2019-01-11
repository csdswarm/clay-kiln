'use strict';
// This logic is duplicated in the spa because Vue doesn't support module.exports

const redirectDataURL = '/_components/redirects/instances/default@published',
  /**
   * determines if a url is inside an array of redirect objects
   *
   * @param {string} url
   * @param {object} req
   * @returns {boolean}
   */
  testURL = (url, req) => createRegExp(url).test(`${req.protocol}://${req.hostname}${req.originalUrl}`),
  /**
   * converts a string into a regular expression * as a wildcard
   *
   * @param {string} url
   * @param {string} limit
   * @returns {RegExp}
   */
  createRegExp = (url, limit = '$') => {
    let regExp = url.replace(/\*/g, '.*');

    return new RegExp(`^${regExp}${limit}`, 'i');
  };

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 * @param {object} client
 * @param {function} extract
 * @param {string} modifier
 */
module.exports = async (req, res, next, { client, extract = (data) => data, modifier = '' }) => {
  try {
    const data = await client.get(`${modifier}${req.hostname}${redirectDataURL}`),
      redirects = extract(data).redirects.sort((first, second) => first.url.indexOf('*') - second.url.indexOf('*'));

    if (redirects && redirects.some(item => testURL(item.url, req))) {
      return res.redirect(redirects.filter(item => testURL(item.url, req))[0].redirect);
    }
  } catch (e) {
  }
  return next();
};
