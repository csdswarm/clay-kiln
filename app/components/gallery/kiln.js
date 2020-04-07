'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img'),
  applyContentLogic = require('../../services/kiln/apply-content-logic');

module.exports = (schema) => {
  autoFillRecircImg(schema);
  applyContentLogic(schema);
  return syncFields(schema, syncHeadlines('gallery'));
};
