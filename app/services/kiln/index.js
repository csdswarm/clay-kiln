'use strict';

const { secureAllSchemas } = require('./permissions');

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/new-page-override')();
  require('./plugins/content-import')();
  require('./plugins/word-count')();
  require('./plugins/advanced-image-upload')();
  require('./plugins/alerts')();
  require('./plugins/podcast-select')();
  require('./plugins/brightcove')();
  require('./plugins/bulk-image-upload')();
  require('./plugins/content-syndication')();
  require('./plugins/content-search')();
  require('./plugins/instagram')();
  require('./plugins/subscriptions')();
  require('./plugins/select-list')();
  require('./plugins/stores')();
  require('./plugins/valid-source')();
  require('./validators')();
  secureAllSchemas();
};
