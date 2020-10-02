'use strict';

const { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  applyContentLogic = require('../../services/kiln/apply-content-logic'),
  autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img'),
  differenceBy = require('lodash/differenceBy'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  applyContentLogic(schema);
  autoFillRecircImg(schema);

  schema.byline = new KilnInput(schema, 'byline');

  schema.formValidation = () => {
    const authors = schema.byline.value()[0].names,
      hosts = schema.byline.value()[0].hosts,
      filtered = differenceBy(authors, hosts, 'text');

    if (authors.length > filtered.length) {
      schema.byline.showSnackBar({ message: 'Authors and Hosts should be different' });
      return false;
    }

    return true;
  };

  return syncFields(schema, syncHeadlines('gallery'));
};
