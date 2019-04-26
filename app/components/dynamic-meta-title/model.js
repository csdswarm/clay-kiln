'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.paramValue = locals.params[data.routeParam];

    // Set first character of each word to upper case.
    if (data.paramValue && data.paramValue.length) {
      data.paramValue = hypensToSpaces(data.paramValue).replace(/\b\w/g, l => l.toUpperCase());
    }

  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      data.paramValue = value;
      data.metaValue = value;
      if (ref.includes('/station@published')) {
        data.metaValue = `Listen to ${value} Online`;
      }
    }
  }

  return data;
};
