'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  schemaService = require('../../services/kiln/permissions');

module.exports = (schema) => {
  schemaService.publishRights(schema);

  return syncFields(schema, syncHeadlines('gallery'));
};
