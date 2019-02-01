'use strict';

module.exports['1.0'] = function (uri, data) {
  data.sectionFront = data.sectionFront || data.filterBySection;
  delete data.filterBySection;
  data.tag = '';

  return data;
};
