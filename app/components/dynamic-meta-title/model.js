'use strict';

const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  matcher = require('../../services/universal/url-matcher'),
  _get = require('lodash/get');

/**
 * returns the metaValue, paramValue and suffix from either the component's data
 *   or url match entry.
 *
 * @param {object} dataOrMatch
 * @param {object} locals
 * @returns {object}
 */
function getValuesAndSuffix(dataOrMatch, locals) {
  const { localsPath, metaLocalsPath, routeParam, suffix } = dataOrMatch,
    localsVal = localsPath
      ? _get(locals, localsPath)
      : undefined;
  let metaValue, paramValue;

  if (routeParam && _get(locals, 'params')) {
    metaValue = paramValue = hypensToSpaces(locals.params[routeParam]);
  } else if (localsVal) {
    paramValue = localsVal;
    metaValue = metaLocalsPath
      ? _get(locals, metaLocalsPath)
      : localsVal;
  }

  return { metaValue, paramValue, suffix };
}

module.exports = unityComponent({
  render: (uri, data, locals) => {
    const urlMatch = data.urlMatches.find(
        ({ urlString }) => matcher(urlString, locals.url)
      ),
      { paramValue, metaValue, suffix } = getValuesAndSuffix(urlMatch || data, locals),
      computedSuffix = suffix || data.suffix || '';

    Object.assign(data._computed, {
      title: `${toTitleCase(paramValue) || ''}${computedSuffix}`,
      metaTitle: `${toTitleCase(metaValue) || ''}${computedSuffix}`
    });

    return data;
  }
});
