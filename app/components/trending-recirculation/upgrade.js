'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};
