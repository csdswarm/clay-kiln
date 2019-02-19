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
  const sectionFronts = [
      'news',
      'sports',
      'music',
      'small-business-pulse'
    ],
    isSectionFront = sectionFronts.filter(sectionFront => uri.indexOf(`instances/${sectionFront}`) !== -1);

  // Only change the filter value for the HP instance
  if (isSectionFront.length && data.filterTags.filter(tag => tag.text === 'Radio.com Latino')) {
    data.filterTags = data.filterTags || [];
    data.filterTags.push({text: 'Radio.com Latino'});
  }

  return data;
};
