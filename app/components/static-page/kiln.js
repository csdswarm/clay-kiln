'use strict';

const addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = schema => {
  addStationNoteToCustomUrl(new KilnInput(schema));
  handleEditModePlaceholders(new KilnInput(schema));
  return schema;
};
