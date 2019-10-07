'use strict';

const schemaService = require('../../services/kiln/permissions'),
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils');

module.exports = (schema) => {
  schemaService.publishRights(schema);
  return syncFields(schema, syncHeadlines('gallery'));
};
