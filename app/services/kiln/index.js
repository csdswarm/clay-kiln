'use strict';

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/content-import')();
  require('./plugins/word-count')();
  require('./plugins/advanced-image-upload')();
  require('./plugins/podcast-select')();
  require('./plugins/instagram')();
  require('./validators')();
};
