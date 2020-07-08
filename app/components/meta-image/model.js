'use strict';

const _get = require('lodash/get'),
  _isString = require('lodash/isString');

module.exports.render = (ref, data, locals) => {
  if (data.localsKey && locals) {
    const value = _get(locals, data.localsKey);

    if (value && data.imageUrl.includes('${paramValue}')) {
      data.imageUrl = data.imageUrl.replace('${paramValue}', value);
    } else if (value) {
      if (!_isString(value)) {
        throw new Error(
          'the dynamic value must point to a string'
          + `\ntypeof value: ${typeof value}`
        );
      }

      data.imageUrl = value;
    }
  }

  return data;
};
