'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  { toTitleCase } = require('../../services/universal/utils'),
  matcher = require('../../services/universal/url-matcher'),
  _get = require('lodash/get');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    let paramValue, metaValue, suffix;

    if (data.routeParam && locals && locals.params) {
      paramValue = metaValue = hypensToSpaces(locals.params[data.routeParam]);
    } else if (data.localsKey && locals) {
      const value = _get(locals, data.localsKey);
  
      if (value) {
        paramValue = value;
        metaValue = data.metaLocalsKey ? _get(locals, data.metaLocalsKey) : value;
      }
    }

    (data.urlMatches || []).some(({ routeParam, suffix: matchSuffix, urlString }) => {
      if (matcher(urlString, locals.url)) {
        if (routeParam && locals && locals.params) {
          paramValue = metaValue = hypensToSpaces(locals.params[routeParam]);
        }
        suffix = matchSuffix;
        return true;
      }
    });
  
    data._computed = {
      title: toTitleCase(paramValue) || '',
      metaTitle: toTitleCase(metaValue) || '',
      suffix: suffix || data.suffix
    };
  
    return data;
  }
});
