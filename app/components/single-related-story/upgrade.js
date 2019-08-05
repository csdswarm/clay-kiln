'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

// no version 1.0 because the schema version was already set at 1.1 when no
//   upgrades existed

module.exports['2.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, [data], locals);

  return data;
};
