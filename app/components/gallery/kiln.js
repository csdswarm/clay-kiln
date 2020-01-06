'use strict';

const addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  addStationNoteToCustomUrl(new KilnInput(schema));
  syncFields(schema, syncHeadlines('gallery'));

  return schema;
};
