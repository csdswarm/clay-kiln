'use strict';

const { enforcePublishRights } = require('../../services/kiln/permissions'),
  addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const input = new KilnInput(schema);

  enforcePublishRights(schema);
  addStationNoteToCustomUrl(input);

  return schema;
};
