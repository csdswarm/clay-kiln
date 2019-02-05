'use strict';

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  data.sectionFront = data.sectionFront || data.filterBySection;
  delete data.filterBySection;
  data.tag = '';

  return data;
};