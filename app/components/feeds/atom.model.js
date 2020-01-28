'use strict';

const { buildModel } = require('./utils'),
  log = require('../../services/universal/log').setup({ file: __filename, action: 'atom-transform' });

module.exports = buildModel({ log, prefix: 'atom', utmSource: 'msn' });
