'use strict';

const applyContentLogic = require('../../services/kiln/apply-content-logic');

module.exports = (schema) => {
  applyContentLogic(schema);

  return schema;
};
