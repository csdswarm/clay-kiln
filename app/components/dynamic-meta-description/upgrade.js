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
