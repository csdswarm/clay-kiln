'use strict';

module.exports['1.0'] = function (uri, data) {
  // Replace articleType with sectionFront
  data.sectionFront = data.articleType;
  delete data.articleType;

  return data;
};
