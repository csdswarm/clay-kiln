'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img');

module.exports = (schema) => {
  autoFillRecircImg(schema);
  return syncFields(schema, syncHeadlines('article'));
};
