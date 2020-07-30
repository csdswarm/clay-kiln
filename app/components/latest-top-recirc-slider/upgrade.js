'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};

module.exports['2.0'] = async (uri, data) => {
  // Account for inccorrect formatting of data.tag in the database for previously created content.
  // Instances of data.tag that do not return an empty array, or properly formatted tag array will break the kiln UI.
  // e.g. tag array: data.tag: [] || data.tag: [{ text: 'tag' }].
  if (data.tag.length === 0) {
    data.tag = [];
    return data;
  } else if (Array.isArray(data.tag)) {
    data.tag = data.tag.map((tag) => typeof tag === 'string' ? { text: tag } : tag);
    return data;
  }
  return data;
};
