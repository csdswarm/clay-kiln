'use strict';

const getBaseUrlFromLocals = require('../../services/universal/get-base-url-from-locals');

module.exports.render = (ref, data, locals) => {
  data.localUrl = getBaseUrlFromLocals(locals);
  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }

  return data;
};
