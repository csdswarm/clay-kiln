'use strict';

const pkg = require('../../package.json'),
  amphoraPkg = require('amphora/package.json'),
  kilnPkg = require('clay-kiln/package.json'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  compression = require('compression'),
  session = require('express-session'),
  RedisStore = require('connect-redis')(session),
  db = require('../server/db'),
  routes = require('../../routes'),
  canonicalJSON = require('./canonical-json'),
  initSearch = require('./amphora-search'),
  initCore = require('./amphora-core'),
  locals = require('./spaLocals'),
  handleRedirects = require('./redirects'),
  user = require('./user'),
  radiumApi = require('./radium');

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
  app.set('trust proxy', 0);
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

  app.use(cookieParser());

  app.use(handleRedirects);

  app.use(user);

  app.use(locals);

  /**
   * radium.radio.com endpoints
   *
   * This is not in the routes/index.js file because you are forced to be logged in to access any route at that level
   * There is a tech debt item to investigate with NYM why all routes added by kiln require authentication
   */
  app.all('/radium/*', (req, res) => {
    radiumApi.apply(req, res).then((data) => {
      return res.json(data);
    }).catch((e) => {
      console.log(e);
      res.status(500).json({ message: 'An unknown error has occurred.' });
    });
  });

  app.use(canonicalJSON);

  db.setup();
  sessionStore = createSessionStore();

  return initSearch()
    .then(search => initCore(app, search, sessionStore, routes));
}

module.exports = setupApp;
