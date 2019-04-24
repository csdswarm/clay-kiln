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
      const description = data.description
        .replace('${paramValue}', hypensToSpaces(value))
        .replace(/\b\w/g, l => l.toUpperCase());

      if (locals.station) {
        data.description = `Listen to ${description} Live. Anytime. Anywhere`;
      } else {
        data.description = description;
      }
    }
  }

  return data;
};
