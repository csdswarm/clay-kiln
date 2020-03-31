'use strict';

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    urlMatches: data.urlMatches || []
  };
};

module.exports['1.0'] = async (uri, data) => {
  return {
    ...data,
    routeParam: ''
  };
};
