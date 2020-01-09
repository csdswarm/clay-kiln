'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    data.dateModified = (new Date()).toISOString();
    return createContent.save(uri, data, locals);
  }
});
