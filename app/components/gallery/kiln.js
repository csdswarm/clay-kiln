'use strict';

const { syncFields } = require('../../services/client/kiln-utils');

module.exports = (schema) => {
  const fields = {
    gallery: {
      headline: ['primaryHeadline', 'shortHeadline', 'teaser', 'plaintextPrimaryHeadline', 'plaintextPrimaryHeadline']
    }
  };

  return syncFields(schema, fields);
};
