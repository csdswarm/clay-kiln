'use strict';

module.exports.save = (uri, data, locals) => {
  // If data.description is an empty string and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  if (data.description === '' && locals.newPageStation) {
    data.description       = locals.newPageStation.description;
    };
  return data;
};
