'use strict';

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    urlMatches: data.urlMatches || []
  };
};

module.exports['2.0'] = (uri, data) => {
  let { metaLocalsKey } = data;

  if (metaLocalsKey) {
    metaLocalsKey = Array.isArray(metaLocalsKey) ? metaLocalsKey : [ metaLocalsKey ];

    return { ...data, metaLocalsKey };
  }

  return data;
};

// key is the wrong term because 'path' is the term lodash employs
module.exports['3.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;
  data.metaLocalsPath = data.metaLocalsPath || data.metaLocalsPath;

  delete data.localsKey;

  return data;
};
