'use strict';

const schemaService = require('../../services/kiln/schema');

module.exports = (schema) => {
  schemaService.publishRights(schema);

  return schema;
};
