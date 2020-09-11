'use strict';

const
  _set = require('lodash/set'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const { site_slug } = window.kiln.locals.station;

  if (site_slug) {
    schema.items = new KilnInput(schema, 'items');
    _set(schema.items, '_has.validate.min', 1);
  }

  return schema;
};
