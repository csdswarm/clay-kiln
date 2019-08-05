'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = function (uri, data) {
  // Only change the filter value for the HP instance
  if (uri.indexOf('homepage')) {
    data.filterTags = [{text: 'Radio.com Latino'}];
  } else {
    data.filterTags = [];
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  let newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};

  delete newData.filterSecondaryArticleTypes;

  return newData;
};

module.exports['3.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};
