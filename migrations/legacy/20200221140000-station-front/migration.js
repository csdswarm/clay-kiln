'use strict';

const updateNewPages = require('./update-new-pages');

const host = process.argv[2] || 'clay.radio.com';

Promise.all([
  updateNewPages(host)
]);
