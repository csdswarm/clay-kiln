'use strict';

const { enforcePublishRights } = require('../../services/kiln/permissions'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  enforcePublishRights(schema);
  handleEditModePlaceholders(new KilnInput(schema));
  return schema;
};
