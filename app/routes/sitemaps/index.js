'use strict';

const express = require('express'),
  router = new express.Router(),
  sitemapsWithIndex = require('./with-index');

sitemapsWithIndex.addRoutes(router);

module.exports = router;
