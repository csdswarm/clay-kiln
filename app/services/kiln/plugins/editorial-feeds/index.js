'use strict';

// Require depedencies.
const editorialFeedContent = require('./editorial-feeds-main.vue'),
  editorialFeed = require('./editorial-feeds.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['editorial-feeds'] = editorialFeed;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['editorial-feeds'] = editorialFeedContent;
};
