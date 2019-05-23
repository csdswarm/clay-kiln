'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param'),
  { toTitleCase } = require('../../services/universal/utils'),
  _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.paramValue = data.metaValue = hypensToSpaces(locals.params[data.routeParam]);
  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey),
      metaValue = data.metaLocalsKey ? _get(locals, data.metaLocalsKey) : value;

    if (value) {
      data.paramValue = value;
      data.metaValue = metaValue;
    }
  }

  // Set first character of each word to upper case.
  data.paramValue = toTitleCase(data.paramValue);
  data.metaValue = toTitleCase(data.metaValue);

  return data;
};
