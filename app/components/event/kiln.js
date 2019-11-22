'use strict';

const
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils');

module.exports = (schema) => {
  return syncFields(schema, syncHeadlines('event'));
};
