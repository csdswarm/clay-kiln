'use strict';


// Require depedencies.

const apNewsContent = require('./ap-news-main.vue'),
  apNews = require('./ap-news.vue'),
  _set = require('lodash/set');

// Register plugin.
module.exports = () => {
  _set(window, 'kiln.navButtons.ap-news', apNews);
  _set(window, 'kiln.navContent.ap-news', apNewsContent);

};
