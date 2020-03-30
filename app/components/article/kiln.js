'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput,
  autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img');

module.exports = (schema) => {
  autoFillRecircImg(schema);
  handleEditModePlaceholders(new KilnInput(schema));
  return syncFields(schema, syncHeadlines('article'));
};
