'use strict';
const { unityComponent } = require('../../services/universal/amphora'),
  { assignStationInfo } = require('../../services/universal/create-content.js');

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
