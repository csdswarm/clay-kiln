'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', hypensToSpaces(locals.params[data.routeParam]));

    // Set first character to upper case.
    if (data.description && data.description.length) {
      data.description = data.description.replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return data;
};
