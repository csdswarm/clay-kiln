'use strict';
const { unityComponent } = require('../../services/universal/amphora'),
  { assignStationInfo } = require('../../services/universal/create-content'),
  _get = require('lodash/get');

/**
 * adds the primaryColor to _computed if a primary section front
 * which is used in the template to set a global css var and
 * eliminates the need for complicated postCSS mixin
 *
 * @param {object} data
 * @param {object} locals
 * @returns {string}
 */
function addPrimaryColorToPrimarySectionFronts(data, locals) {
  let primaryColor = '';

  switch (_get(locals,'sectionFront', '').toLowerCase()) {
    case 'music':
      primaryColor = '#FF4940';
      break;
    case 'news':
      primaryColor = '#FEC517';
      break;
    case 'sports':
      primaryColor = '#0099FF';
      break;
    case 'audio':
      primaryColor = '#00CCB7';
      break;
    default:
      break;
  }
  return primaryColor;
}

module.exports = unityComponent({
  render: (uri, data, locals) => {
    if (data.title) {
      if (data.primary) {
        locals.sectionFront = data.title.toLowerCase();
      } else {
        locals.sectionFront = data.primarySectionFront;
        locals.secondarySectionFront = data.title.toLowerCase();
      }
    }

    data._computed.primaryColor = addPrimaryColorToPrimarySectionFronts(data, locals);

    return data;
  },
  save: (uri, data, locals) => {
    assignStationInfo(uri, data, locals);

    return {
      ...data,
      revealSectionFrontControls: !data.stationFront && !data.titleLocked
    };
  }
});
