'use strict';

const { assignStationInfo } = require('../../services/universal/create-content');

module.exports.render = (uri, data, locals) => {
  if (data.title) {
    if (data.primary) {
      locals.sectionFront = data.title.toLowerCase();
    } else {
      locals.sectionFront = data.primarySectionFront;
      locals.secondarySectionFront = data.title.toLowerCase();
    }
  }

  return data;
};

module.exports.save = (uri, data, locals) => {
  assignStationInfo(uri, data, locals);

  return {
    ...data,
    revealSectionFrontControls: !data.stationFront && !data.titleLocked
  };
};
