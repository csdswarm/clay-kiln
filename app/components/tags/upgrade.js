'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  // Replace articleType with sectionFront
  data.sectionFront = data.articleType;
  data.articleType = '';

  return data;
};
