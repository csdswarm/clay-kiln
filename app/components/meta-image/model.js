'use strict';

const _get = require('lodash/get'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports.render = (ref, data, locals) => {
  if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value && data.defaultImageUrl.includes('${paramValue}')) {
      data.defaultImageUrl = data.defaultImageUrl.replace('${paramValue}', value);
    } else {
      data.defaultImageUrl = value;
    }
  }

  return data;
};

module.exports.save = (ref, data) => {
  handleDefault('imageUrl', 'defaultImageUrl', data);

  return data;
};
