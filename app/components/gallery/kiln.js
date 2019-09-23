'use strict';

const autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img');

module.exports = (schema) => {
  autoFillRecircImg(schema);

  return schema;
};
