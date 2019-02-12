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
