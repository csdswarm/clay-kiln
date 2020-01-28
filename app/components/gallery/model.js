'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs');

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    await autoLink(data, ['sectionFront', 'secondarySectionFront'], locals);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    data.totalSlides = data.slides.length;
    return createContent.save(uri, data, locals);
  }
});
