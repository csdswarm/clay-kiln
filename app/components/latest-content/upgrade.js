'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Only change the filter value for the HP instance
  if (uri.indexOf('default')) {
    data.filterTags = [{ text: 'Radio.com Latino' }];
  } else {
    data.filterTags = [];
  }

  return data;
};

module.exports['3.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};
  
  delete newData.filterSecondaryArticleTypes;
  
  return newData;
};

module.exports['4.0'] = async (uri, data, locals) => {
  for (const section of data.sectionFronts) {
    const items = data[`${section}Items`];

    await addUriToCuratedItems(uri, items, locals);
  }

  return data;
};
