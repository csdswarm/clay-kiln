'use strict';
const _indexOf = require('lodash/indexOf');

module.exports.render = (ref, data, locals) => {
  // ON-560 canonicals should be https
  if (locals && locals.url) {

    const fullUrl = locals.url.replace('http:', 'https:'),
      params = _indexOf(fullUrl, '?'),
      clearQueryParams = params > 0 ? fullUrl.substring(0, params) : fullUrl;

    data.localUrl = clearQueryParams;
  }
  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }

  return data;
};
