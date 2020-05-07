'use strict';

const { simpleListRights } = require('../../services/kiln/permissions');

module.exports = (schema) => {
  return simpleListRights(schema, 'items');
};
