'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  { toTitleCase } = require('../../services/universal/utils'),
  matcher = require('../../services/universal/url-matcher'),
  _get = require('lodash/get');

/**
 * Get the meta title based on metaLocalsKey or fallback to regular title
 * @param {object} data
 * @param {object} locals
 * @param {string} title
 * @return {string}
 */
const createMetaTitle = (data, locals, title) => {
  const { metaLocalsKey } = data;

  if (metaLocalsKey) {
    return metaLocalsKey
      .map(key => _get(locals, key))
      .filter(val => !!val)
      .join(' - ') || title;
  }

  return title;
};

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
        metaValue = createMetaTitle(data, locals, value);
      }
    }

    data._computed = Object.assign(data._computed, {
      title: `${toTitleCase(paramValue) || ''}${suffix || data.suffix}`,
      metaTitle: `${toTitleCase(metaValue) || ''}${suffix || data.suffix}`
    });

    return data;
  }
});
