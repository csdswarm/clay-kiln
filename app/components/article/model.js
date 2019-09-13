'use strict';

const createContent = require('../../services/universal/create-content'),
  {autoLink} = require('../breadcrumbs');

module.exports.render = function (ref, data, locals) {
  // TODO: ON-1029 remove when integrated with BE
  data.latestRecircSlider = {
    _ref: 'clay.radio.com/_components/latest-top-recirc-slider/instances/test1030'
  };
  autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  data.dateModified = (new Date()).toISOString();
  return createContent.save(uri, data, locals);
};
