'use strict';
const helpers = require('./helpers');

module.exports.render = (ref, data, locals) => {
  helpers.fixSyndicatedUrl(data);
  helpers.fixHttpUrl(data);
  return data;
};

module.exports.save = (ref, data, locals) => {
  helpers.setFromLocals(data, locals);
  helpers.fixHttpUrl(data);
  return data;
};
