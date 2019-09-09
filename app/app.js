'use strict';

var pkg = require('./package.json'),
  logger = require('./services/universal/log'),
  log = logger.init(pkg.version),
  express = require('express'),
  startup = require('./services/startup'),
  port = process.env.PORT || 3001,
  ip = process.env.IP_ADDRESS || '0.0.0.0',
  log = logger.setup({ file: __filename }),
  nodeMemwatch = require('node-memwatch');

nodeMemwatch.on('leak', info => {
  console.log('--------------------');
  console.log('--------------------');
  console.log('leak');
  console.log(JSON.stringify(info, null, 2));
  console.log('--------------------');
  console.log('--------------------');
});

nodeMemwatch.on('stats', stats => {
  console.log('--------------------');
  console.log('--------------------');
  console.log('stats');
  console.log(JSON.stringify(stats, null, 2));
  console.log('--------------------');
  console.log('--------------------');
});

startup(express())
  .then(function (router) {
    router.get('/trigger-gc', (_req, res) => {
      nodeMemwatch.gc();
      res.status(200).end();
    });

    router.listen(port, ip);
    log('info', 'Clay listening on ' + ip + ':' + port + ' (process ' + process.pid + ')');
  })
  .catch(function (error) {
    log('error', error);
  });
