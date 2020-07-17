'use strict';

const _set = require('lodash/set'),
  syndicatedContentButton = require('./syndicated-content-button.vue'),
  syndicatedContent = require('./syndicated-content.vue');

module.exports = () => {
  _set(window, 'kiln.navButtons.manage-syndicated-content', syndicatedContentButton);
  _set(window, 'kiln.navContent.manage-syndicated-content', syndicatedContent);
};
