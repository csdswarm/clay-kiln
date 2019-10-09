'use strict';

const schemaService = require('../../services/kiln/permissions');

module.exports = (schema) => {
  schemaService.publishRights(schema);

  return schema;
};
