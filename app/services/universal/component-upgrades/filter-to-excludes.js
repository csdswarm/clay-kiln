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
    data.filterSectionFronts = data.filterSectionFronts || data.filterPrimarySectionFronts;
    delete data.filterPrimarySectionFronts;
  }
  
  ['SectionFronts', 'SecondarySectionFronts', 'Tags'].forEach(field => {
    data[`exclude${field}`] = data[`exclude${field}`] || data[`filter${field}`] || (field === 'Tags' ? [] : {});
    
    delete data[`filter${field}`];
  });

  return data;
};
