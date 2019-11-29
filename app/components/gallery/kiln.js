'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  syncFields(schema, syncHeadlines('gallery'));
  addStationNoteToCustomUrl(new KilnInput(schema));

  return schema;
};
