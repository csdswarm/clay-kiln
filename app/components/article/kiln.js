'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  schemaService = require('../../services/kiln/permissions'),
  addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  KilnInput = window.kiln.kilnInput;

module.exports = schema => {
  schemaService.publishRights(schema);
  addStationNoteToCustomUrl(new KilnInput(schema));

  return syncFields(schema, syncHeadlines('article'));
};
