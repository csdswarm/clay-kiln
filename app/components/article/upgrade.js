'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  // Replace articleType with sectionFront, add new contentType property
  data.sectionFront = data.articleType;
  data.contentType = 'article';
  delete data.articleType;
  delete data.section;

  return data;
};
