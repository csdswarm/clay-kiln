'use strict';

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Only change the filter value for the HP instance
  if (uri.indexOf('default')) {
    data.filterTags = [{text: 'Radio.com Latino'}];
  } else {
    data.filterTags = [];
  }

  return data;
};

module.exports['3.0'] = function (uri, data) {
  return {
    ...data,
    filterSecondarySectionFronts: data.filterSecondaryArticleTypes || {}
  };
}
