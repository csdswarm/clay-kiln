'use strict';

const createContent = require('../../services/universal/create-content'),
  {autoLink} = require('../breadcrumbs'),
  loadedIdsService = require('../../services/server/loaded-ids');

module.exports.render = async function (ref, data, locals) {
  await loadedIdsService.appendToLocalsAndRedis([ref], locals);
  autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  data.totalSlides = data.slides.length;
  return createContent.save(uri, data, locals);
};
