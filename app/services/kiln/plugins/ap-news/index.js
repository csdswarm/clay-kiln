'use strict';


// Require depedencies.

const apNewsContent = require('./ap-news-main.vue'),
  apNews = require('./ap-news.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navButtons['ap-news'] = apNews;
  window.kiln.navContent = window.kiln.navContent || {};
  window.kiln.navContent['ap-news'] = apNewsContent;
};
