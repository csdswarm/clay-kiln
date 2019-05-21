'use strict';

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
  const newData = {
    ...data,
    filterSecondarySectionFronts: data.filterSecondaryArticleTypes || {}
  };

  delete newData.filterSecondaryArticleTypes;
  return newData;
};
