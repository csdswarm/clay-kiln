'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  applyContentLogic = require('../../services/kiln/apply-content-logic'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  applyContentLogic(schema);
  handleEditModePlaceholders(new KilnInput(schema));

  return syncFields(schema, syncHeadlines('article'));
};
