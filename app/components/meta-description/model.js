'use strict';

module.exports.save = (uri, data, locals) => {
  const populateDescription = (data.description === '' || data.description === undefined) ? true : false;
  // If data.description is an empty string or undefined, and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  if (populateDescription && locals.newPageStation) {
    data.description       = locals.newPageStation.description;
  };
  return data;
};
