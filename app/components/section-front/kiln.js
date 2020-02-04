'use strict';

const { enforcePublishRights } = require('../../services/kiln/permissions'),
  addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  handleEditModePlaceholders = require('../../services/kiln/handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  enforcePublishRights(schema);
  addStationNoteToCustomUrl(new KilnInput(schema));
  handleEditModePlaceholders(new KilnInput(schema));

  return schema;
};
