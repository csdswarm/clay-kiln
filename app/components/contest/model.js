'use strict';

const createContent = require('../../services/universal/create-content');

module.exports.render = function (ref, data, locals) {
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  data.dateModified = (new Date()).toISOString();
  return createContent.save(uri, data, locals);
};
