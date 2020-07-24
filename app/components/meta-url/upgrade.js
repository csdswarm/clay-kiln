'use strict';
const helpers = require('./helpers');

module.exports['1.0'] = function (uri, data) {
  helpers.fixHttpUrl(data);
  helpers.fixSyndicatedUrl(data);

  return data;
};

module.exports['2.0'] = (uri, data) => {
  return Object.assign(data, {
    defaultDate: data.date,
    defaultSyndicatedUrl: data.syndicatedUrl,
    defaultUrl: data.url
  });
};
