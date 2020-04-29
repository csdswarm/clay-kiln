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
