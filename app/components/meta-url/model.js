'use strict';

const _indexOf = require('lodash/indexOf'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save'),
  helpers = require('./helpers');

module.exports.render = (ref, data, locals) => {
  if (locals && locals.url) {
    const fullUrl = locals.url.replace('http:', 'https:'),
      params = _indexOf(fullUrl, '?'),
      clearQueryParams = params > 0 ? fullUrl.substring(0, params) : fullUrl;

    data.localUrl = clearQueryParams;
  }
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
