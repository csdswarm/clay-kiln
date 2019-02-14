'use strict';
const helpers = require('./helpers');

module.exports.save = (ref, data, locals) => {
  helpers.setFromLocals(data, locals);
  helpers.fixHttpUrl(data);
  helpers.fixSyndicatedUrl(data);
  return data;
};
