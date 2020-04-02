'use strict';

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    urlMatches: data.urlMatches || []
  };
};

// key is the wrong term because 'path' is the term lodash employs
module.exports['2.0'] = async (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;

  delete data.localsKey;

  return data;
};
