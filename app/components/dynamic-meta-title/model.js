'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  { toTitleCase } = require('../../services/universal/utils'),
  matcher = require('../../services/universal/url-matcher'),
  _get = require('lodash/get');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    const urlMatch = data.urlMatches.find(({ urlString }) => matcher(urlString, locals.url));

    let paramValue, metaValue, suffix;

    if (urlMatch) {
      if (urlMatch.routeParam && locals && locals.params) {
        paramValue = metaValue = hypensToSpaces(locals.params[urlMatch.routeParam]);
      }
      suffix = urlMatch.suffix;
    } else if (data.routeParam && locals && locals.params) {
      paramValue = metaValue = hypensToSpaces(locals.params[data.routeParam]);
    } else if (data.localsKey && locals) {
      const value = _get(locals, data.localsKey);

      if (value) {
        paramValue = value;

        if (data.metaLocalsKey) {
          if (!Array.isArray(data.metaLocalsKey)) {
            data.metaLocalsKey = [ data.metaLocalsKey ];
          }

          metaValue = data.metaLocalsKey
            .map(key => _get(locals, key))
            .filter(val => !!val)
            .join(' ') || value;
        } else {
          metaValue = value;
        }
      }
    }

    data._computed = Object.assign(data._computed, {
      title: `${toTitleCase(paramValue) || ''}${suffix || data.suffix}`,
      metaTitle: `${toTitleCase(metaValue) || ''}${suffix || data.suffix}`
    });

    return data;
  }
});
