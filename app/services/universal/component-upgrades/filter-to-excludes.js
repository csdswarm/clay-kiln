'use strict';
const _has = require('lodash/has');

/**
 * Handles the name change from filterSectionFronts, etc to excludeSectionFronts, etc and
 * moving any existing data over. If there is already an excludes, then the filter fields is simply deleted
 * if not, the filter field data is transferred to the exclude field. If neither field exists, then the exclude
 * field is initialized with an empty array.
 *
 * @param {string} uri
 * @param {object} data
 *
 * @returns {object}
 */
module.exports = (uri, data) => {

  if (_has(data, 'filterPrimarySectionFronts')) {
    data.excludeSectionFronts = data.excludeSectionFronts
      || data.excludePrimarySectionFronts
      || data.filterPrimarySectionFronts;

    delete data.filterPrimarySectionFronts;
    delete data.excludePrimarySectionFronts;
  }
  
  ['SectionFronts', 'SecondarySectionFronts, Tags'].forEach(field => {
    let excludes = [];
    
    if (_has(data,`filter${field}`)) {
      excludes = data[`exclude${field}`] || data[`filter${field}`];

      delete data[`filter${field}`];
    }

    data[`exclude${field}`] = excludes;
  });


  return data;
};
