'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', hypensToSpaces(locals.params[data.routeParam]));

    // Set first character of each word to upper case.
    if (data.description && data.description.length) {
      data.description = data.description.replace(/\w[^\s\-]*/g, l => l.charAt(0).toUpperCase() + l.substr(1));
    }
  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      data.description = data.description
        .replace('${paramValue}', value)
        .replace(/\w[^\s\-]*/g, l => l.charAt(0).toUpperCase() + l.substr(1));
    }
  }

  return data;
};
