'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  applyContentLogic = require('../../services/kiln/apply-content-logic');

module.exports = (schema) => {
  applyContentLogic(schema);
  return syncFields(schema, syncHeadlines('gallery'));
};
