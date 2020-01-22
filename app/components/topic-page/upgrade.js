'use strict';

const moreContentFeedToTwoColumn = require('../../services/universal/component-upgrades/more-content-feed-to-two-column');

module.exports['1.0'] = function (uri, data, locals) { // eslint-disable-line no-unused-vars
  data.content = [];
  data.sectionFront = '';

  return data;
};

module.exports['2.0'] = moreContentFeedToTwoColumn;
