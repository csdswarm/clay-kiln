'use strict';

const addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  addStationNoteToCustomUrl(new KilnInput(schema));
  syncFields(schema, syncHeadlines('gallery'));
  handleEditModePlaceholders(new KilnInput(schema));
  return syncFields(schema, syncHeadlines('gallery'));
};
