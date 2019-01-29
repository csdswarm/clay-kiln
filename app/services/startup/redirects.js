'use strict';

const db = require('../server/db'),
  redirectDataURL = '/_components/redirects/instances/default@published',
  /**
   * determines if a url is inside an array of redirect objects
   *
   * @param {string} url
   * @param {object} req
   * @returns {boolean}
   */
  testURL = (url, req) => createRegExp(url).test(`${req.protocol}://${req.hostname}${req.originalUrl.replace('?json', '')}`),
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
   * logic for determining if a url should be checked for possible redirects
   *
   * @param {object} req
   * @returns {boolean}
   */
  possibleRedirect = (req) => {
    const referrer = req.get('referrer');

    return req.get('x-amphora-page-json') || !referrer || !referrer.includes(req.get('host'));
  };

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  try {
    if (possibleRedirect(req)) {
      const data = await db.get(`${req.get('host')}${redirectDataURL}`),
        redirects = data.redirects.sort((first, second) => first.url.indexOf('*') - second.url.indexOf('*')),
        redirectTo = redirects ? redirects.find(item => testURL(item.url, req)) : null;

      if (redirectTo) {
        // request coming from SPA, 301 and send new URL
        if (req.originalUrl.includes('?json')) {
          res.status(301).json({ redirect: redirectTo.redirect });
        } else {
          return res.redirect(301, redirectTo.redirect);
        }
      }
    }
  } catch (e) {
    console.log('Error in redirects middleware:');
    console.log(e);
  }
  return next();
};

