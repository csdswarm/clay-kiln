'use strict';

module.exports['1.0'] = function (uri, data) {
  if (!uri.includes('instances/new')) {
    return {...data, titleLocked: !!data.title, primary: !!data.title };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  if (!uri.includes('instances/new')) {
    return {
      ...data,
      revealSectionFrontControls: !data.stationFront && !data.titleLocked,
      revealStationControls: data.stationFront && !data.titleLocked
    };
  }

  return data;
};
