'use strict';
const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { unityComponent } = require('../../services/universal/amphora'),
  matcher = require('../../services/universal/url-matcher'),
  _flow = require('lodash/flow'),
  _get = require('lodash/get');

const paramVal = '${paramValue}';

/**
 * gets the computed description from either data or the url match, each will
 *   have potential properties 'description', 'localsPath' and 'routeParam'
 *
 * @param {object} obj - either the component data or the successful url match
 * @param {string} obj.description
 * @param {string} [obj.localsPath]
 * @param {string} [obj.routeParam]
 * @param {object} locals
 * @returns {string}
 */
function getComputedDescription({ description, localsPath, routeParam } = {}, locals) {
  const localsVal = localsPath
    ? _get(locals, localsPath)
    : undefined;

  let computedDescription = description;

  if (routeParam && _get(locals, 'params')) {
    computedDescription = description.replace(
      paramVal,
      _flow(hypensToSpaces, toTitleCase)(locals.params[routeParam])
    );
  } else if (localsVal) {
    computedDescription = description.replace(
      paramVal,
      toTitleCase(localsVal)
    );
  }

  return computedDescription;
}

module.exports = unityComponent({
  render: (ref, data, locals) => {
    const urlMatch = data.urlMatches.find(
      ({ urlString }) => matcher(urlString, locals.url)
    );

    data._computed.description = getComputedDescription(urlMatch || data, locals);

    return data;
  }
});
