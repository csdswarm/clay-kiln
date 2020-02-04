'use strict';

const { enforcePublishRights } = require('../../services/kiln/permissions');

module.exports = (schema) => {
  enforcePublishRights(schema);

  return schema;
};
