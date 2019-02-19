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

  newData.filterSecondaryArticleTypes = {};

  // Replace articleType with sectionFront
  if (data.filterSecondaryArticleType) {
    newData.filterSecondaryArticleTypes[data.filterSecondaryArticleType] = true;
  }
  delete newData.filterSecondaryArticleType;

  return newData;
};

module.exports['3.0'] = function (uri, data) {
  data.filterTags = data.filterTags || [];

  // Only change the filter value for the HP instance
  if (data.filterTags.filter(tag => tag.text === 'Radio.com Latino')) {
    data.filterTags.push({text: 'Radio.com Latino'});
  }

  return data;
};
