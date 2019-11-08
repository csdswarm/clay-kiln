'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs'),
  loadedIdsService = require('../../services/server/loaded-ids');

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    await loadedIdsService.appendToLocalsAndRedis([uri], locals);
    autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    data.totalSlides = data.slides.length;
    return createContent.save(uri, data, locals);
  }
});
