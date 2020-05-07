'use strict';

const
  contentSubscriber = require('./content-subscriber'),
  sectionFrontSubscriber = require('./section-front-subscriber'),
  stationFrontSubscriber = require('./station-front-subscriber');


module.exports = () => {
  sectionFrontSubscriber();
  stationFrontSubscriber();
  contentSubscriber();
};
