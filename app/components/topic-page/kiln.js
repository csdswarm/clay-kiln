'use strict';

const handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  handleEditModePlaceholders(new KilnInput(schema));
  return schema;
};
