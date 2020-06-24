'use strict';

const sanitize = require('../../services/universal/sanitize');

module.exports.save = (uri, data, locals) => {
  const populateTitle = (data.title === '' || data.title === undefined) ? true : false;
  
  // If data.title is an empty string or undefined, and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  if (populateTitle && locals.newPageStation) {
    data.title       = `${locals.newPageStation.name} ${locals.newPageStation.slogan}`;
    data.kilnTitle   = `${locals.newPageStation.name} ${locals.newPageStation.slogan}`;
  };
  return sanitize.recursivelyStripSeperators(data);
};
