'use strict';

const createContent = require('../../services/universal/create-content');

module.exports.render = function (ref, data, locals) {
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  return createContent.save(uri, data, locals);
};
