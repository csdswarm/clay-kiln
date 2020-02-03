'use strict';

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  // Replace articleType with sectionFront
  if (newData.populateBy == 'articleType') {
    newData.populateBy = 'sectionFront';
  }
  newData.sectionFront = data.sectionFront || data.articleType;
  delete newData.articleType;

  return newData;
};

module.exports['2.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['3.0'] = function (uri, data) {
  const { populateBy, ...restOfData } = data;

  return { ...restOfData, populateFrom: populateBy };
};
