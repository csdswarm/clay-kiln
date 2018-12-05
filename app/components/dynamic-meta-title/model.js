'use strict';

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params) {
    data.paramValue = locals.params[data.routeParam];

    // Set first character to upper case.
    if (data.paramValue && data.paramValue.length) {
      data.paramValue = data.paramValue.replace(/\b\w/g, l => l.toUpperCase());
    }

  }

  return data;
};
