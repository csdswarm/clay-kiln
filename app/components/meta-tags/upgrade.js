'use strict';

module.exports['1.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.secondarySectionFront = data.secondaryArticleType || '';

  delete newData.secondaryArticleType;

  return newData;
};
