'use strict';

const appleNewsKiln = require('../../services/client/appleNewsKilnjs');

module.exports = schema => {
  return appleNewsKiln(schema, 'article');
};
