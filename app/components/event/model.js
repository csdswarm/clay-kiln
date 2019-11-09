'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  { autoLink } = require('../breadcrumbs');

module.exports = unityComponent({
  save: (ref, data) => {
    // NOTE: may need to return createContent.render(uri, data, locals);
    return data;
  },
  render: (ref, data, locals) => {
    // NOTE: figure out what is needed here
    autoLink(data, ['stationSlug', '{events}'], locals.site.host);
    // NOTE: may need to return createContent.render(uri, data, locals);
    return data;
  }
});
