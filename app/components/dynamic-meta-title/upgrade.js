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

/**
 * change *Key to *Path since 'path' is the term lodash employs
 *
 * note: data.*Key props should be removed in a later release since they are no
 *   longer used
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 **/
module.exports['4.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;
  data.metaLocalsPath = data.metaLocalsPath || data.metaLocalsKey;

  return data;
};
