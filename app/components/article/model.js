'use strict';

const _get = require('lodash/get'),
  { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs'),
  defaultTextWithOverride = {
    onModelSave: require('../../services/kiln/plugins/default-text-with-override/on-model-save')
  };

module.exports = unityComponent({
  render: (uri, data, locals) => {
    autoLink(data, ['sectionFront', 'secondarySectionFront'], locals.site.host);
    return createContent.render(uri, data, locals);
  },
  save: (uri, data, locals) => {
    data.dateModified = (new Date()).toISOString();

    defaultTextWithOverride.onModelSave.handleDefault('msnTitle', 'headline', data);
    data.msnTitleLength = _get(data.msnTitle, 'length', 0);

    return createContent.save(uri, data, locals);
  }
});
