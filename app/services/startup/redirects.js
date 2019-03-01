'use strict';

const db = require('../server/db'),
  redirectDataURL = '/_components/redirects/instances/default@published',
  queryString = require('querystring'),

  /**
   * determines if a url is inside an array of redirect objects
   *
   * @param {string} url
   * @param {object} req
   * @returns {boolean}
   */
  testURL = (url, req) => createRegExp(url.replace(/^(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,}\.[a-z]{2,})/, '')).test(`${req.originalUrl.replace('?json', '')}`),
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
  },
  /**
   * Recursively get the latest URI for a URL
   *
   * @param {string} uri
   */
  getLatestUri = async (uri) => {
    try {
      const latestUri = await db.get(uri);

      if (typeof latestUri === 'string' && latestUri.indexOf('/_uris') !== -1) {
        return getLatestUri(latestUri);
      } else {
        return uri;
      }
    } catch (e) {
      console.log(e.message);
    }
  };

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  console.log(req.originalUrl);
  delete req.query.json;
  const spaRequest = req.originalUrl.includes('?json'),
    redirectQueryString = queryString.stringify(req.query);
  let runNext = true;
console.log('query string: ', redirectQueryString);
  try {
    if (possibleRedirect(req)) {
      console.log('possible redirect');
      const data = await db.get(`${req.get('host')}${redirectDataURL}`),
        redirects = data.redirects.sort((first, second) => first.path.indexOf('*') - second.path.indexOf('*')),
        redirectTo = redirects ? redirects.find(item => testURL(item.path, req)) : null;

      if (redirectTo) {
        // request coming from SPA, 301 and send new URL
        if (spaRequest) {
          res.status(301).json({ redirect: redirectTo.redirect });
        } else {
          return res.redirect(301, redirectTo.redirect);
        }
        runNext = false;
      }
      // Handle Amphora redirects (Replicating https://github.com/clay/amphora/blob/6.x-lts/lib/render.js#L219)
      if (spaRequest) {
        console.log('check');
        const encode64Buffer = Buffer.from(`${req.hostname}${req.path}`, 'utf8'),
          latestUri = await getLatestUri(`${req.hostname}/_uris/${encode64Buffer.toString('base64')}`),
          decode64Buffer = Buffer.from(latestUri.split('/').pop(), 'base64'),
          redirectUrl = decode64Buffer.toString('utf8');

        if ((req.hostname + req.path) !== redirectUrl) {
          console.log('Reidrect to', redirectUrl.replace(req.hostname, '') +  redirectQueryString);
          res.status(301).json({ redirect: redirectUrl.replace(req.hostname, '') +  redirectQueryString});
          runNext = false;
        }
      }
    }

  } catch (e) {
    console.log('Error in redirects middleware:');
    console.log(e);
  }

  if (runNext) {
    next();
  }
};

