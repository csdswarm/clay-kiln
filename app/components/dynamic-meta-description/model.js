'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', hypensToSpaces(locals.params[data.routeParam]));

    // Set first character of each word to upper case.
    if (data.description && data.description.length) {
      data.description = data.description.replace(/\b\w/g, l => l.toUpperCase());
    }
  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      if (locals.station) {
        data.description = `Listen to ${locals.station.name} - ${locals.station.slogan}. Live. Anytime. Anywhere.`;
      } else {
        data.description = data.description
          .replace('${paramValue}', hypensToSpaces(value))
          .replace(/\b\w/g, l => l.toUpperCase());;
      }
    }
  }

  return data;
};
