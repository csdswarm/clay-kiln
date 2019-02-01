'use strict';

module.exports['1.0'] = function (uri, data) {
  data.sectionFront = data.sectionFront || data.filterBySection;
  delete data.filterBySection;
  data.tag = '';

  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};
