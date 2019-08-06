'use strict';

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/content-import')();
  require('./plugins/word-count')();
  require('./plugins/advanced-image-upload')();
  require('./plugins/alerts')();
  require('./plugins/podcast-select')();
  require('./plugins/brightcove')();
  require('./plugins/content-syndication')();
  require('./plugins/instagram')();
  require('./plugins/subscriptions')();
  require('./plugins/stations')();
  require('./validators')();
};
