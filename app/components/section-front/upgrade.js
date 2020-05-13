'use strict';

const { getComponentInstance } = require('clayutils'),
  moreContentFeedToTwoColumn = require('../../services/universal/component-upgrades/more-content-feed-to-two-column'),
  { addMultiColumnToSectionFront } = require('./upgrade-helpers');

module.exports['1.0'] = function (uri, data) {
  if (getComponentInstance(uri) !== 'new') {
    return { ...data, titleLocked: !!data.title, primary: !!data.title };
  }

  return data;
};

module.exports['2.0'] = moreContentFeedToTwoColumn;

module.exports['3.0'] = function (uri, data) {
  if (!uri.includes('instances/new')) {
    return {
      ...data,
      revealSectionFrontControls: !data.stationFront && !data.titleLocked,
      revealStationControls: data.stationFront && !data.titleLocked
    };
  }

  return data;
};
module.exports['4.0'] = addMultiColumnToSectionFront;
