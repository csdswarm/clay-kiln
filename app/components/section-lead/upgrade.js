'use strict';

module.exports['1.0'] = function (uri, data, locals) {
  data.sectionFront = data.filterBySection;
  delete data.filterBySection;
  data.tag = '';

  return data;
};
