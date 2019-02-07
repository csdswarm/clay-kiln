'use strict';
const helpers = require('./helpers')

module.exports['1.0'] = function (uri, data, locals) { // eslint-disable-line no-unused-vars
  helpers.fixHttpUrl(data)
  helpers.fixSyndicatedUrl(data)

  return data;
};
