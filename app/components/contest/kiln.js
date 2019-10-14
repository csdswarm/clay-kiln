'use strict';

const schemaService = require('../../services/kiln/permissions'),
  addStationNoteToCustomUrl = require('../../services/kiln/add-station-note-to-custom-url'),
  KilnInput = window.kiln.kilnInput,
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils');

module.exports = (schema) => {
  schemaService.publishRights(schema);
  addStationNoteToCustomUrl(new KilnInput(schema));
  
  return syncFields(schema, syncHeadlines('contest'));
};
