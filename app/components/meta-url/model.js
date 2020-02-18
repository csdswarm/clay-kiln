'use strict';

const helpers = require('./helpers'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports.save = (ref, data, locals) => {
  helpers.setFromLocals(data, locals);
  helpers.fixHttpUrl(data);
  helpers.fixSyndicatedUrl(data);

  handleDefault('url', 'defaultUrl', data);
  handleDefault('syndicatedUrl', 'defaultSyndicatedUrl', data);
  handleDefault('date', 'defaultDate', data);

  return data;
};
