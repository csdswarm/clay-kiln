'use strict';

const
  { addStationCheckToSelect } = require('./station-lists'),
  { secureAllSchemas } = require('./permissions');

// exported as "kiln-plugins"
module.exports = () => {
  window.kiln.helpers = require('../../services/universal/helpers');
  require('./plugins/advanced-image-upload')();
  require('./plugins/alerts')();
  require('./plugins/all-page-override')();
  require('./plugins/brightcove')();
  require('./plugins/bulk-image-upload')();
  require('./plugins/content-import')();
  require('./plugins/content-search')();
  require('./plugins/content-syndication')();
  require('./plugins/default-text-with-override')();
  require('./plugins/instagram')();
  require('./plugins/content-subscriptions')();
  require('./plugins/manage-syndicated-content')();
  require('./plugins/new-page-override')();
  require('./plugins/podcast-select')();
  require('./plugins/restrict-users')();
  require('./plugins/select-list')();
  require('./plugins/sign-out-override')();
  require('./plugins/stations')();
  require('./plugins/stores')();
  require('./plugins/subscriptions')();
  require('./plugins/valid-source')();
  require('./plugins/word-count')();
  require('./plugins/editorial-feeds')();
  require('./validators')();
  secureAllSchemas();
  addStationCheckToSelect();
};
