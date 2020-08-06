'use strict';

const _get = require('lodash/get'),
  addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  newData.sectionFront = newData.sectionFront || data.filterBySection;
  delete newData.filterBySection;
  newData.tag = '';

  if (!newData.contentType) {
    newData.contentType = { article: true, gallery: true };
  }

  return newData;
};

module.exports['3.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  newData.filterSecondaryArticleTypes = {};

  // Replace articleType with sectionFront
  if (data.filterSecondaryArticleType) {
    newData.filterSecondaryArticleTypes[data.filterSecondaryArticleType] = true;
  }
  delete newData.filterSecondaryArticleType;

  return newData;
};

module.exports['4.0'] = function (uri, data) {
  data.filterTags = data.filterTags || [];

  // Add tag if it's not already on the section lead
  if (!data.filterTags.filter(tag => tag.text === 'Radio.com Latino').length) {
    data.filterTags.push({ text: 'Radio.com Latino' });
  }

  return data;
};


module.exports['5.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};

  delete newData.filterSecondaryArticleTypes;

  return newData;
};


module.exports['6.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};


module.exports['7.0'] = async (uri, data) => {
  data.excludeSecondarySectionFronts = data.filterSecondarySectionFronts || data.excludeSecondarySectionFronts;
  data.excludeTags = data.filterTags || data.excludeTags;

  delete data.filterSecondarySectionFronts;
  delete data.filterTags;

  return data;
};

module.exports['8.0'] = (uri, data) => {
  // Account for incorrect formatting of data.primaryStoryLabel in the database for previously created content
  // primaryStoryLabel is being changed from [ {text: ““} ] or [] to string
  if (Array.isArray(data.primaryStoryLabel)) {
    data.primaryStoryLabel = data.primaryStoryLabel.map(item => _get(item, 'text', item)).join();
  }
  return data;
};
