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
  return {
    ...data,
    filterSecondarySectionFronts: data.filterSecondaryArticleTypes || {}
  };
};
