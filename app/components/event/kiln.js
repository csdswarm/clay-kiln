'use strict';

const
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  { watchMultiLineComponentChanges } = require('../../services/client/kiln-multiline');

module.exports = (schema) => {
  watchMultiLineComponentChanges(schema);
  return syncFields(schema, syncHeadlines('event'));
};
