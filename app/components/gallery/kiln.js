'use strict';

const { syncFields } = require('../../services/client/kiln-utils');

module.exports = (schema) => {
  return syncFields(schema, syncHeadlines('article'));
};
