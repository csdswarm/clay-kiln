'use strict';

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/word-count')();
  require('./plugins/advanced-image-upload')();
  require('./plugins/podcast-select')();
  require('./plugins/brightcove')();
  require('./plugins/content-syndication')();
  require('./plugins/instagram')();
  require('./validators')();
};
