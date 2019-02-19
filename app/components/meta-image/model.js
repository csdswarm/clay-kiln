'use strict';

const _get = require('lodash/get');

module.exports.render = (ref, data, locals) => {
  if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value) {
      data.imageUrl = data.imageUrl.replace('${paramValue}', value);
    }
  }

  return data;
};
