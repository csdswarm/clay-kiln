'use strict';

const session = require('express-session'),
  RedisStore = require('connect-redis')(session),
  expressRdcSessionSecret = process.env.EXPRESS_RDC_SESSION_SECRET;

if (
  !expressRdcSessionSecret
  || typeof expressRdcSessionSecret !== 'string'
) {
  throw new Error(
    'process.env.EXPRESS_RDC_SESSION_SECRET must be truthy'
    + "\n(make sure it's populated in app/.env"
  );
}

/**
 * This just adds a redis-backed session we can use for RDC purposes since we
 *   don't have control over when amphora initializes its session store, which
 *   is probably for the better anyway.  At this time I needed it just to
 *   provide a session key but future uses may arise.
 *
 * Note: since amphora uses its own session, we won't have access to RDC session
 *   after the amphora middleware (amphora will overwrite req.session).  This
 *   should be fine though because either
 *   1. we shouldn't be taking requests after amphora has a chance to respond or
 *   2. amphora should be a separate endpoint entirely
 *
 * @param {object} app - the express app
 * @returns {object} - the mutated express app
 */
module.exports = app => {
  const rdcSessionPrefix = `${process.env.REDIS_DB}-rdc-session:`,
    rdcRedisStore = new RedisStore({
      url: process.env.REDIS_SESSION_HOST,
      prefix: rdcSessionPrefix
    });

  // I'm just copying this from startup.js -> createSessionStore as I assume the
  //   same logic applies
  rdcRedisStore.setMaxListeners(0);

  app.use(session({
    store: rdcRedisStore,
    prefix: rdcSessionPrefix,
    secret: expressRdcSessionSecret,
    // why this is false:
    // https://www.npmjs.com/package/express-session#resave
    resave: false
  }));

  app.use((req, res, next) => {
    // sessionID will be overwritten by amphora, so we should store it in
    //   locals now.
    res.locals.rdcSessionID = req.sessionID;
    next();
  });

  return app;
};
