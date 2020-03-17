'use strict';

const handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  schemaService = require('../../services/kiln/permissions'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  handleEditModePlaceholders(new KilnInput(schema));
  schemaService.publishRights(schema);
  return schema;
};
