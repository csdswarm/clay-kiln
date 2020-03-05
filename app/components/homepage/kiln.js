'use strict';

const handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput,
  schemaService = require('../../services/kiln/permissions');

module.exports = (schema) => {
  schemaService.publishRights(schema);
  handleEditModePlaceholders(new KilnInput(schema));
  return schema;
};
