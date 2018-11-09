'use strict';

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = (ref, data, locals) => {
  if (!locals) {
    return data;
  }
  switch (data.filterStationsBy) {
    case 'market':
    case 'genre':
      data.title = data.overrideTitle || 'stations near you';
      break;
    case 'section-front':
      if (data.sectionFront == 'entertainment' || data.sectionFrontManual == 'entertainment') {
        data.title = data.overrideTitle || 'music stations near you';
      } else {
        data.title = data.overrideTitle || `${data.sectionFrontManual ? data.sectionFrontManual : data.sectionFront} stations near you`;
      }
      break;
    default:
  }
  return data;
};
