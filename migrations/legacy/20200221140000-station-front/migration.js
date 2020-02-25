'use strict';

const createNewComponentInstance = require('./component-new-instance');
const createPage = require('./create-page');
const updateNewPages = require('./update-new-pages');
const createESIndex = require('./create-elasticsearch-index');

const host = process.argv[2] || 'clay.radio.com';

Promise.all([
  createPage(host),
  updateNewPages(host),
  createNewComponentInstance(host),
  createESIndex(host)
]);
