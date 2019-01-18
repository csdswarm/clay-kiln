'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  // Replace articleType with sectionFront
  if (data.populateBy == 'articleType') {
    data.populateBy = 'sectionFront';
  }
  data.sectionFront = data.articleType;
  delete data.articleType;

  return data;
};
