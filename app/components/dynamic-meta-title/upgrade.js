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

module.exports['3.0'] = (uri, data) => {
  const isCuratedTopic = uri.endsWith('curated-topic');

  if (isCuratedTopic) {
    return {
      ...data,
      routeParam: ''
    };
  }

  return data;
};


module.exports['4.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;
  data.metaLocalsPath = data.metaLocalsPath || data.metaLocalskey;

  delete data.localsKey;
  delete data.metaLocalsKey;

  return data;
};
