'use strict';

// Require depedencies.
const editorialFeedContent = require('./editorial-feeds-main.vue'),
  editorialFeed = require('./editorial-feeds.vue'),
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  { unityAppDomainName: unityApp } = require('../../../universal/urps');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  const user = _get(window.kiln, 'locals.user'),
    hasAccessEditorialFeeds = user && user.can('access').the('editorial-feeds').for(unityApp).value;

  if (hasAccessEditorialFeeds) {
    _set(window, 'kiln.navButtons.editorial-feeds', editorialFeed);
    _set(window, 'kiln.navContent.editorial-feeds', editorialFeedContent);
  }
};
