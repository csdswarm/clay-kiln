'use strict';

const sanitize = require('../../services/universal/sanitize');

module.exports.save = (uri, data, locals) => {
  // If data.title is an empty string or undefined, and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  const populateTitle = (data.title === '' || data.title === undefined) && locals.newPageStation;

  if (populateTitle) {
    data.title     = `${locals.newPageStation.name} ${locals.newPageStation.slogan}`;
    data.kilnTitle = data.title;
  };
  return sanitize.recursivelyStripSeperators(data);
};
