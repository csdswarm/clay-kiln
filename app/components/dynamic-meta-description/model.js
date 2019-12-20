'use strict';
const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  matcher = require('../../services/universal/url-matcher'),
  _flow = require('lodash/flow'),
  _get = require('lodash/get');

module.exports = unityComponent({
  render: (ref, data, locals) => {
    const urlMatch = data.urlMatches.find(({ urlString }) => matcher(urlString, locals.url));

    let description;

    if (urlMatch) {
      if (urlMatch.routeParam && locals && locals.params) {
        description = urlMatch.description.replace('${paramValue}', _flow(hypensToSpaces, toTitleCase)(locals.params[urlMatch.routeParam]));
      } else {
        description = urlMatch.description;
      }
    } else if (data.routeParam && locals && locals.params) {
      description = data.description.replace('${paramValue}', _flow(hypensToSpaces, toTitleCase)(locals.params[data.routeParam]));
    } else if (data.localsKey && locals) {
      const value = _get(locals, data.localsKey);

      if (value) {
        description = data.description.replace('${paramValue}', toTitleCase(value));
      }
    }
    
    data._computed = Object.assign(data._computed, {
      description: description || data.description
    });

    return data;
  }
});
