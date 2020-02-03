'use strict';

const addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  addStationNoteToCustomUrl(new KilnInput(schema));

  return schema;
};
