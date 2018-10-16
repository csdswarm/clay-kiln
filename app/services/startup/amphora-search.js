'use strict';

const amphora = require('amphora'),
  amphoraSearch = require('amphora-search'),
  path = require('path'),
  log = require('../universal/log').setup({ file: __filename });

function setup() {
  return amphoraSearch.setup({
    prefix: process.env.ELASTIC_PREFIX,
    db: amphora.db,
    sites: amphora.sites,
    mappings: path.resolve('./search/mappings'),
    handlers: path.resolve('./search/handlers'),
    sitemaps: true
  })
    .then(function () {
      log('info', `Using ElasticSearch at ${process.env.ELASTIC_HOST}`);

      return amphoraSearch;
    });
}

module.exports = setup;
