'use strict';

const sectionFrontSubscriber = require('./section-front-subscriber'),
  contentSubscriber = require('./content-subscriber');


module.exports = () => {
  sectionFrontSubscriber();
  contentSubscriber();
};
