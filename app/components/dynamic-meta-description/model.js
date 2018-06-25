'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', hypensToSpaces(locals.params[data.routeParam]));
  }

  return data;
};
