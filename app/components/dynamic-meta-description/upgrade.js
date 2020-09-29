'use strict';

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    urlMatches: data.urlMatches || []
  };
};

module.exports['2.0'] = async (uri, data) => {
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
 * change localsKey to localsPath since 'path' is the term lodash employs
 *
 * note: data.localsKey should be removed in a later release since it is no
 *   longer used
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 **/
module.exports['3.0'] = (uri, data) => {
  data.localsPath = data.localsPath || data.localsKey;

  return data;
};
