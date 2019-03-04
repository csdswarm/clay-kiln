'use strict';
const helpers = require('./helpers');

module.exports['1.0'] = function (uri, data) {
  helpers.fixHttpUrl(data);
  helpers.fixSyndicatedUrl(data);

  return data;
};
