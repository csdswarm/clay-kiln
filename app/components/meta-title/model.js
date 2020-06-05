'use strict';

const sanitize = require('../../services/universal/sanitize');

module.exports.save = (uri, data, locals) => {
  // If data.title is an empty string and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  if (data.title === '' && locals.newPageStation) {
    data.title       = locals.newPageStation.name;
    data.kilnTitle   = locals.newPageStation.name;
  };
  return sanitize.recursivelyStripSeperators(data);
};
