'use strict';

const urlParse = require('url-parse'),
  matchPath = (urlPath, routePath) => {
    const urlPathParts = urlPath.split('/'),
      routePathParts = routePath.split('/');
        
    return urlPathParts.length === routePathParts.length && urlPathParts.every((urlPart, index) => {
      return urlPart === routePathParts[index] || routePathParts[index].startsWith(':');
    });
  };

module.exports = (route, url) => {
  const parsedUrl = urlParse(url);

  return matchPath(parsedUrl.pathname, route);
};
