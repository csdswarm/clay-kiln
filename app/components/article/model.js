'use strict';
const createContent = require('../../services/universal/create-content'),
  {autoLink} = require('../breadcrumbs');

module.exports.render = function (ref, data, locals) {
  autoLink(data, ['sectionFront', 'secondaryArticleType'], locals.site.host);
  // set to published date if before the publish date.
  if (!data.dateModified || data.dateModified < data.date) {
    data.dateModified = data.date;
  }
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  data.dateModified = (new Date()).toISOString();
  return createContent.save(uri, data, locals);
};
