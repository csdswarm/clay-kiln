'use strict';

const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  matcher = require('../../services/universal/url-matcher'),
  _get = require('lodash/get');

/**
 * Get the meta title based on metaLocalsPath or fallback to regular title
 * @param {object} dataOrMatch
 * @param {object} locals
 * @param {string} title
 * @return {string}
 */
const createMetaTitle = (dataOrMatch, locals, title) => {
  const { metaLocalsPath } = dataOrMatch;

  if (metaLocalsPath) {
    return metaLocalsPath
      .map(key => _get(locals, key))
      .filter(val => !!val)
      .join(' - ') || title;
  }

  return title;
};

/**
 * returns the metaValue, paramValue and suffix from either the component's data
 *   or url match entry.
 *
 * @param {object} dataOrMatch
 * @param {object} locals
 * @returns {object}
 */
function getValuesAndSuffix(dataOrMatch, locals) {
  const { localsPath, routeParam, suffix } = dataOrMatch,
    localsVal = localsPath
      ? _get(locals, localsPath)
      : undefined;
  let metaValue, paramValue;

  if (routeParam && _get(locals, 'params')) {
    metaValue = paramValue = hypensToSpaces(locals.params[routeParam]);
  } else if (localsVal) {
    metaValue = createMetaTitle(dataOrMatch, locals, localsVal);
    paramValue = locals.url.includes('/listen')
      ? metaValue
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
