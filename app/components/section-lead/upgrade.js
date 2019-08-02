'use strict';

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

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
  let newData = Object.assign({}, data);

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
    data.filterTags.push({text: 'Radio.com Latino'});
  }

  return data;
};


module.exports['5.0'] = function (uri, data) {
  let newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};
  
  delete newData.filterSecondaryArticleTypes;
  
  return newData;
};
