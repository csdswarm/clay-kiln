'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs');

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    locals.loadedIds.push(uri);
    await autoLink(data, [
      { slug: data.stationSlug, text: data.stationName },
      'sectionFront',
      'secondarySectionFront'
    ], locals);
    return createContent.render(uri, data, locals);
  },
  save: async (uri, data, locals) => {
    data.totalSlides = data.slides.length;
    await createContent.save(uri, data, locals);

    return data;
  }
});
