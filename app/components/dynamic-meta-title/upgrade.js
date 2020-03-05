'use strict';

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    urlMatches: data.urlMatches || []
  };
};

// key is the wrong term because 'path' is the term lodash employs
module.exports['2.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;
  data.metaLocalsPath = data.metaLocalsPath || data.metaLocalskey;

  delete data.localsKey;
  delete data.metaLocalsKey;

  return data;
};
