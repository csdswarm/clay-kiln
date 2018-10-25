'use strict';

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = (ref, data, locals) => {
  switch (data.filterStationsBy) {
    case 'market':
      data.title = 'stations near you' || data.overrideTitle;
      break;
    case 'section-front':
      if (data.sectionFront == 'entertainment') {
        data.title = 'music stations near you' || data.overrideTitle;
      } else {
        data.title = `${data.sectionFront} stations near you` || data.overrideTitle;
      }
      break;
    case 'genre':
      data.title = `${data.genre} stations near you` || data.overrideTitle;
      break;
    default:
  }
  return data;
};
