'use strict';

module.exports.save = (uri, data, locals) => {
  // If data.description is an empty string or undefined, and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  const populateDescription = (data.description === '' || data.description === undefined) && locals.newPageStation;

  if (populateDescription) {
    data.description = locals.newPageStation.description;
  };
  return data;
};
