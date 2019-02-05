'use strict';

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

  // Replace articleType with sectionFront
  newData.sectionFront = data.sectionFront || data.articleType;;
  delete newData.articleType;

  return newData;
};
