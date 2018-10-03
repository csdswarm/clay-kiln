'use strict';

const pkg = require('../../package.json'),
  amphoraPkg = require('amphora/package.json'),
  kilnPkg = require('clay-kiln/package.json'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  session = require('express-session'),
  RedisStore = require('connect-redis')(session),
  db = require('../server/db'),
  initSearch = require('./amphora-search'),
  initCore = require('./amphora-core');

function createSessionStore() {
  var sessionPrefix = process.env.REDIS_DB ? `${process.env.REDIS_DB}-clay-session:` : 'clay-session:',
    redisStore = new RedisStore({
      url: process.env.REDIS_SESSION_HOST,
      prefix: sessionPrefix
    });

  // because we're adding session handling to every site, our redis client needs
  // to have a higher max listener cap. we're setting it to 0 to disable the cap
  redisStore.setMaxListeners(0);

  return redisStore;
}

function setupApp(app) {
  var sessionStore;
  // Enable GZIP

  if (process.env.ENABLE_GZIP) {
    app.use(compression());
  }

  // set app settings
  app.set('trust proxy', 1);
  app.set('strict routing', true);
  app.set('x-powered-by', false);
  app.use(function (req, res, next) {
    res.set('X-Powered-By', [
      'clay v' + pkg.version,
      'amphora v' + amphoraPkg.version,
      'kiln v' + kilnPkg.version
    ].join('; '));
    next();
  });

  // nginx limit is also 1mb, so can't go higher without upping nginx
  app.use(bodyParser.json({
    limit: '5mb'
  }));

  app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true
  }));

  db.setup();
  sessionStore = createSessionStore();

  return initSearch()
    .then(search => initCore(app, search, sessionStore));

  return app;
}

module.exports = setupApp;
