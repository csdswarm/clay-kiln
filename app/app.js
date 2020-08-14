'use strict';

var pkg,
  logger,
  log,
  environmentVariablesInDb,
  express,
  startup,
  port,
  ip;

// The .env file should be processed before doing anything else.
require('dotenv').config();

pkg = require('./package.json');
logger = require('./services/universal/log');
log = logger.init(pkg.version);
express = require('express');
environmentVariablesInDb = require('./services/server/environment-variables-in-db.js');
startup = require('./services/startup');
port = process.env.PORT || 3001;
ip = process.env.IP_ADDRESS || '0.0.0.0';
log = logger.setup({ file: __filename });

startup(express())
  .then(function (router) {
    router.listen(port, ip);
    log('info', 'Clay listening on ' + ip + ':' + port + ' (process ' + process.pid + ')');

    environmentVariablesInDb();
    log('info', 'Node args', process.execArgv);
  })
  .catch(function (error) {
    log('error', error);
  });
