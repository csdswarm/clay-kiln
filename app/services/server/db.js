'use strict';

const utils = require('../universal/utils'),
  db = require('amphora-storage-postgres');

module.exports.getUri = uri => db.get(uri);
module.exports.get = db.get;
module.exports.put = db.put;
module.exports.uriToUrl = utils.uriToUrl;
