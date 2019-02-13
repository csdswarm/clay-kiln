'use strict';

const { getKeysValue } = require('../../services/universal/object');

module.exports.render = (ref, data, locals) => {
  if (data.dataKey && locals) {
    const value = getKeysValue(locals, data.dataKey);

    if (value) {
      data.imageUrl = data.imageUrl.replace('${paramValue}', value);
    }
  }

  return data;
};
