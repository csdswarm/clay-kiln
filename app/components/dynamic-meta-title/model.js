'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { getKeysValue } = require('../../services/universal/object');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.paramValue = locals.params[data.routeParam];

    // Set first character of each word to upper case.
    if (data.paramValue && data.paramValue.length) {
      data.paramValue = hypensToSpaces(data.paramValue).replace(/\b\w/g, l => l.toUpperCase());
    }

  } else if (data.dataKey && locals) {
    const value = getKeysValue(locals, data.dataKey);

    if (value) {
      data.paramValue = value;
    }
  }

  return data;
};
