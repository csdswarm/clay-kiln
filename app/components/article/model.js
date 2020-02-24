'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs');

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    locals.loadedIds.push(uri);
    await autoLink(data, ['sectionFront', 'secondarySectionFront'], locals);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    data.dateModified = (new Date()).toISOString();
    return createContent.save(uri, data, locals);
  }
});
