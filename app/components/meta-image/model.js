'use strict';

const { getKeysValue } = require('../../services/universal/object');

module.exports.render = (ref, data, locals) => {
  if (data.localsKey && locals) {
    const value = getKeysValue(locals, data.localsKey);

    if (value) {
      data.imageUrl = data.imageUrl.replace('${paramValue}', value);
    }
  }

  return data;
};
