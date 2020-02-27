'use strict';

const parseHttpDate = require('parsehttpdate'),
  axios = require('axios'),
  { removeEtag, wrapInTryCatch } = require('../middleware-utils'),
  redis = require('../../server/redis'),
  { redisKey } = require('../../universal/msn-feed-utils'),
  {
    CLAY_SITE_PROTOCOL: protocol,
    CLAY_SITE_HOST: host
  } = process.env;

/**
 * Exposes an endpoint '/rdc/msn-feed.rss'
 *
 * 'rdc' here is a namespace convention I'm going to try out for fastly purposes
 *   since we share our domain with other teams.
 *
 * this endpoint is necessary because the default rss feed sets the ETag header
 *   to a unique value every time.  Msn penalizes for that so providing our own
 *   endpoint allows us control over the headers.  Alternatively we could have
 *   intercepted the component instance's route and done the same thing, but
 *   I prefer keeping that component route untouched and use a separate one for
 *   this purpose.
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/rdc/msn-feed.rss', wrapInTryCatch(async (req, res) => {
    // the autogenerated ETag header was changing even when our content wasn't.
    // instead of creating our own ETag header I thought it'd be easier to
    //   implement last-modified
    removeEtag(res);

    const ifModifiedSinceStr = req.get('if-modified-since');

    let lastModifiedStr = await redis.get(redisKey.lastModified),
      lastModifiedDate;

    // if the value isn't in redis for some reason (value gets removed from the
    //   cache or on server initialization), then just set it to the
    //   current time.
    if (!lastModifiedStr) {
      lastModifiedDate = new Date();
      lastModifiedStr = lastModifiedDate.toUTCString();
      redis.set(redisKey.lastModified, lastModifiedStr);
    } else {
      lastModifiedDate = new Date(lastModifiedStr);
    }

    res.set('Last-Modified', lastModifiedStr);

    if (ifModifiedSinceStr) {
      // apparently the http spec defines two obsolete date formats which
      //   parseHttpDate doesn't support:
      //
      //   https://www.npmjs.com/package/parsehttpdate#other-formats
      //
      //   If MSN sends us dates in those formats then we'll have to find
      //   another solution
      const ifModifiedSinceDate = parseHttpDate(ifModifiedSinceStr);

      if (lastModifiedDate <= ifModifiedSinceDate) {
        res.status(304).end();
        return;
      }
    }

    const resp = await axios.get(`${protocol}://${host}/_components/feeds/instances/msn.msn`);

    res.send(resp.data);
  }));
};
