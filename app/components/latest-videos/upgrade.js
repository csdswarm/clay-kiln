'use strict';

module.exports['1.0'] = function (uri, data) {
  // Only change the filter value for the HP instance
  if (uri.indexOf('homepage')) {
    data.filterTags = [{ text: 'Radio.com Latino' }];
  } else {
    data.filterTags = [];
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};
  
  delete newData.filterSecondaryArticleTypes;
  
  return newData;
};

module.exports['3.0'] = (uri, data) => ({ title: 'Radio.com Video', ...data });

module.exports['4.0'] = (uri, data) => ({ primaryContentLabel: 'Exclusive Video', ...data });
