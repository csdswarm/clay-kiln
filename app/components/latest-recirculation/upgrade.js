'use strict';

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

  // Replace articleType with sectionFront
  if (newData.populateBy == 'articleType') {
    newData.populateBy = 'sectionFront';
  }
  newData.sectionFront = data.articleType;
  delete newData.articleType;

  return newData;
};

module.exports['2.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};
