'use strict';

const pkg = require('../../package.json'),
  amphoraSearch = require('amphora-search'),
  amphoraPkg = require('amphora/package.json'),
  kilnPkg = require('clay-kiln/package.json'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  compression = require('compression'),
  session = require('express-session'),
  RedisStore = require('connect-redis')(session),
  routes = require('../../routes'),
  canonicalJSON = require('./canonical-json'),
  initCore = require('./amphora-core'),
  locals = require('./locals'),
  currentStation = require('./currentStation'),
  redirectTrailingSlash = require('./trailing-slash'),
  feedComponents = require('./feed-components'),
  handleRedirects = require('./redirects'),
  brightcove = require('./brightcove'),
  log = require('../universal/log').setup({ file: __filename }),
  lytics = require('./lytics'),
  eventBusSubscribers = require('./event-bus-subscribers'),
  addRdcRedisSession = require('./add-rdc-redis-session'),
  handleClearLoadedIds = require('./handle-clear-loaded-ids'),
  user = require('./user'),
  radium = require('./radium');

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

  app.use(redirectTrailingSlash);

  // nginx limit is also 1mb, so can't go higher without upping nginx
  app.use(bodyParser.json({
    limit: '5mb'
  }));

  app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true
  }));

  app.use(cookieParser());

  app.use(handleRedirects);

  addRdcRedisSession(app);

  app.use(handleClearLoadedIds);

  app.use(user);

  app.use(locals);

  app.use(currentStation);

  lytics.inject(app);

  radium.inject(app);

  app.use(canonicalJSON);

  brightcove.inject(app);

  sessionStore = createSessionStore();

  feedComponents.init();

  eventBusSubscribers();

  return amphoraSearch()
    .then(searchPlugin => {
      log('info', `Using ElasticSearch at ${process.env.ELASTIC_HOST}`);

      return initCore(app, searchPlugin, sessionStore, routes);
    });
}

module.exports = setupApp;
