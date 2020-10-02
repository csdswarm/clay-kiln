'use strict';
const differenceBy = require('lodash/differenceBy'),
  KilnInput = window.kiln.kilnInput;

/**
 * Prevent users to add the same Authors and Hosts names.
 *
 * @param {object} schema
 */
module.exports = schema => {
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
};
