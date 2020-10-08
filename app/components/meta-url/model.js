'use strict';

const { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save'),
  getBaseUrlFromLocals = require('../../services/universal/get-base-url-from-locals'),
  helpers = require('./helpers');

module.exports.render = (ref, data, locals) => {
  data.localUrl = getBaseUrlFromLocals(locals);
  return data;
};

module.exports.save = (ref, data, locals) => {
  helpers.setFromLocals(data, locals);
  helpers.fixHttpUrl(data);
  helpers.fixSyndicatedUrl(data);

  handleDefault('url', 'defaultUrl', data);
  handleDefault('syndicatedUrl', 'defaultSyndicatedUrl', data);
  handleDefault('date', 'defaultDate', data);

  return data;
};
