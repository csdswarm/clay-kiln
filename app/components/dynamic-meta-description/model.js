'use strict';
const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  matcher = require('../../services/universal/url-matcher'),
  _flow = require('lodash/flow'),
  _get = require('lodash/get');

module.exports = unityComponent({
  render: (ref, data, locals) => {
    let description;

    if (data.routeParam && locals && locals.params) {
      description = data.description.replace('${paramValue}', _flow(hypensToSpaces, toTitleCase)(locals.params[data.routeParam]));
    } else if (data.localsKey && locals) {
      const value = _get(locals, data.localsKey);

      if (value) {
        description = data.description.replace('${paramValue}', toTitleCase(value));
      }
    }

    (data.urlMatches || []).some(({ description: matchDescription, routeParam, urlString }) => {
      if (matcher(urlString, locals.url)) {
        if (routeParam && locals && locals.params) {
          description = matchDescription.replace('${paramValue}', _flow(hypensToSpaces, toTitleCase)(locals.params[routeParam]));
        } else {
          description = matchDescription;
        }
        return true;
      }
    });
    
    data._computed = Object.assign(data._computed, {
      description: description || data.description
    });

    return data;
  }
});
