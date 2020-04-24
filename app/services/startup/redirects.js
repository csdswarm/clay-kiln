'use strict';

const db = require('../server/db'),
  redirectDataURL = '/_components/redirects/instances/default@published',
  querystring = require('querystring'),
  staticAssets = require('../server/static-assets'),
  logger = require('../universal/logger'),

  /**
   * Removes variables that are passed by the spa from the query string
   *
   * @param {string} url
   * @returns {string}
   */
  stripUrl = (url) => {
    const uri = url.split('?');

    if (uri[1]) {
      const params = querystring.parse(uri[1]);

      delete params.json;
      delete params.cb;

      if (Object.keys(params).length) {
        return `${uri[0]}?${querystring.stringify(params)}`;
      }
    }

    return uri[0];
  },
  /**
   * determines if a url is inside an array of redirect objects
   *
   * @param {string} url
   * @param {object} req
   * @returns {boolean}
   */
  testURL = (url, req) => createRegExp(url.replace(/^(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,}\.[a-z]{2,})/, '')).test(stripUrl(req.originalUrl)),
  /**
   * converts a string into a regular expression * as a wildcard
   *
   * @param {string} url
   * @returns {RegExp}
   */
  createRegExp = (url) => {
    const regExp = url.replace(/\*/g, '.*');

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
      // swallowing db error
    }
  },
  /**
   * Handle Amphora redirects (Replicating https://github.com/clay/amphora/blob/6.x-lts/lib/render.js#L219)
   *
   * @param {object} req
   * @param {object} res
   * @returns {boolean}
   */
  amphoraRedirects = async (req, res) => {
    const encode64Buffer = Buffer.from(`${req.hostname}${req.path}`, 'utf8'),
      latestUri = await getLatestUri(`${req.hostname}/_uris/${encode64Buffer.toString('base64')}`);

    if (latestUri) {
      const decode64Buffer = Buffer.from(latestUri.split('/').pop(), 'base64'),
        redirectUrl = decode64Buffer.toString('utf8');

      if ((req.hostname + req.path) !== redirectUrl) {
        logger(module, req, 'endAt');
        res.status(301).json({ redirect: redirectUrl.replace(req.hostname, '') });
        return false;
      }
    }
    return true;
  };

/**
 * redirects the current request when it matches an existing redirect rule
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  logger(module, req, 'startAt');
  const spaRequest = req.originalUrl.includes('?json');
  let runNext = true;

  try {
    if (!staticAssets.isStaticAsset(req.path) && possibleRedirect(req)) {
      const data = await db.get(`${req.get('host')}${redirectDataURL}`).catch(() => {
          return { redirects: [] };
        }),
        redirects = data.redirects.sort((first, second) => first.path.indexOf('*') - second.path.indexOf('*')),
        redirectTo = redirects ? redirects.find(item => testURL(item.path, req)) : null;

      if (redirectTo) {
        // request coming from SPA, 301 and send new URL
        if (spaRequest) {
          logger(module, req, 'endAt');
          res.status(301).json({ redirect: redirectTo.redirect });
        } else {
          logger(module, req, 'endAt');
          return res.redirect(301, redirectTo.redirect);
        }
        runNext = false;
      }

      if (runNext && spaRequest) {
        runNext = await amphoraRedirects(req, res);
      }
    }

  } catch (e) {
    logger(module, req, 'endAt');
    console.log('Error in redirects middleware:', e);
  }

  if (runNext) {
    logger(module, req, 'endAt');
    next();
  }
};

