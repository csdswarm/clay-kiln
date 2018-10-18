'use strict';

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/word-count')();
  require('./plugins/podcast-select')();
  require('./plugins/advanced-image-upload')();
  require('./validators')();
};
