'use strict';
const { toTitleCase } = require('../../services/universal/utils'),
  { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  _flow = require('lodash/flow'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.description = data.description.replace('${paramValue}', _flow(hypensToSpaces, toTitleCase)(locals.params[data.routeParam]));
  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      data.description = data.description.replace('${paramValue}', toTitleCase(value));
    }
  }

  return data;
};
