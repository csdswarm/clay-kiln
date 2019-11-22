'use strict';

const { buildModel } = require('./utils'),
  log = require('../../services/universal/log').setup({ file: __filename, action: 'rss-transform' });

module.exports = buildModel({ log, prefix: 'gnf', utmSource: 'nym' });
