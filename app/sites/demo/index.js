'use strict';

const publishing = require('../../services/publishing'),
  mainComponentRefs = ['/_components/article/instances'];

module.exports.routes = [
  { path: '/'},
  { path: '/:section'},
  { path: '/:year/:month/:name' },
  { path: '/tags/:tag', dynamicPage: 'tag' }
];

// Resolve the url to publish to
module.exports.resolvePublishUrl = [
  (uri, data, locals) => publishing.getYearMonthSlugUrl(data, locals, mainComponentRefs)
];

module.exports.modifyPublishedData = [
  publishing.addLastModified
];
