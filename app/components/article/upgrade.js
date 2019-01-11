'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  // Replace articleType with sectionFront, add new contentType property
  data.sectionFront = data.articleType;
  data.contentType = 'article';
  data.articleType = '';
  data.section = '';

  return data;
};
