'use strict';

const _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.routeParam && locals && locals.params && locals.params[data.routeParam]) {
    data.imageUrl = data.dynamicImageUrl.replace('${paramValue}', locals.params[data.routeParam]);
  } else if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      data.imageUrl = data.dynamicImageUrl.replace('${paramValue}', value);
    }
  }

  return data;
};
