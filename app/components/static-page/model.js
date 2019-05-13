'use strict';

const createContent = require('../../services/universal/create-content');

/**
 *
 * @param {Object} ref
 * @param {Object} data
 * @param {Object} locals
 * @returns {Object}
 */
module.exports.render = function (ref, data, locals) {
  // TODO: Do we need to add something to set pageTitle? OR seoHeadline, shortHeadline or primaryHeadline
  data.inEdit = locals.edit;
  return data;
};

// TODO: currently not doing anything in save, but createContent.save. would it be better to just `module.exports.save = createContent.save`?
module.exports.save = function (uri, data, locals) {
  // TODO: Same here. Do we need to add something to set pageTitle? OR seoHeadline, shortHeadline or primaryHeadline
  return createContent.save(uri, data, locals);
};
