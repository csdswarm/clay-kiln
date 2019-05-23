'use strict';

const _findKey = require('lodash/findKey'),
  _includes = require('lodash/includes'),
  _noop = require('lodash/noop'),
  rest = require('../../../services/universal/rest'),
  helpers = require('./helpers');

function addPort(uri, location) {
  const hasPort = location.port === '80' ||
    location.port === '443' ||
    uri.indexOf(':' + location.port) !== -1;

  return hasPort ? uri : uri.replace(location.hostname, `${location.hostname}:${location.port}`);
}

function addProtocol(uri, location) {
  const hasProtocol = uri.indexOf(location.protocol) === 0;

  return hasProtocol ? uri : `${location.protocol}//${uri}`;
}

/**
 * add port and protocol to uri
 * @param  {string} uri
 * @param  {object} [location] passed in for testing
 * @return {string}
 */
function uriToUrl(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;

  return addProtocol(addPort(uri, location), location);
}

module.exports = {
  label: 'Evergreen URL',
  description: 'This URL already exists. Please change the slug',
  type: 'error',
  validate(state, location) { // location is passed in for testing only
    // note: this finds any component that has these two fields, meaning we don't have to
    // explicitly test for specific components (article, lede-video, etc)
    const mainUri = _findKey(state.components, (component) => component.evergreenSlug && component.slug),
      mainComponent = mainUri && state.components[mainUri];

    if (mainComponent) {
      const section = mainComponent.section || 'article',
        slug = mainComponent.slug,
        possibleURL = uriToUrl(`${state.site.prefix}/${section}/${slug}.html`, location);

      return rest.getHTML(possibleURL).then(function (html) {
        if (html && !_includes(html, mainUri)) {
          return [{
            uri: mainUri,
            field: 'slug',
            location: `${helpers.labelUtil(helpers.getComponentName(mainUri))} » Publish URL`,
            preview: `/${section}/${slug}.html` // full url is too long
          }];
        } // if no html returned, or html with the component uri (same page), return undefined
      }).catch(_noop); // if error fetching a page, return undefined
    } // if no main component found, return undefined
  }
};
