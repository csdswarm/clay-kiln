'use strict';
const createContent = require('../../services/universal/create-content'),
  {autoLink} = require('../breadcrumbs');

module.exports.render = function (ref, data, locals) {
  data.crumbs = autoLink(data, ['sectionFront', 'secondaryArticleType'], locals.site.host);
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  return createContent.save(uri, data, locals);
};
