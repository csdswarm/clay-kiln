'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { getKeysValue } = require('../../services/universal/object');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', hypensToSpaces(locals.params[data.routeParam]));

    // Set first character of each word to upper case.
    if (data.description && data.description.length) {
      data.description = data.description.replace(/\b\w/g, l => l.toUpperCase());
    }
  } else if (data.dataKey && locals) {
    const value = getKeysValue(locals, data.dataKey);

    if (value) {
      data.description = data.description
        .replace('${paramValue}', hypensToSpaces(value))
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return data;
};
