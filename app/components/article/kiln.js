'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;
  
module.exports = schema => {
  handleEditModePlaceholders(new KilnInput(schema));
  return syncFields(schema, syncHeadlines('article'));
};
