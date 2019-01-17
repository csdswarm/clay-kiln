'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  // Replace articleType with sectionFront
  if (data.populateBy == 'articleType') {
    data.populateBy = 'sectionFront';
  }
  data.sectionFront = data.articleType;
  data.articleType = '';

  return data;
};

module.exports['2.0'] = function (uri, data, locals) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true }
  }

  return data;
};
