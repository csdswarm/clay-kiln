'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.paramValue = locals.params[data.routeParam];

    // Set first character of each word to upper case.
    if (data.paramValue && data.paramValue.length) {
      data.paramValue = data.metaValue = hypensToSpaces(data.paramValue).replace(/\w[^\s\-]*/g, l => l.charAt(0).toUpperCase() + l.substr(1));
    }

  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey),
      metaValue = data.metaLocalsKey ? _get(locals, data.metaLocalsKey) : value;

    if (value) {
      data.paramValue = value;
      data.metaValue = metaValue;
    }
  }

  return data;
};
