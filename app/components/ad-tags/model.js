'use strict';
const slugifyService = require('../../services/universal/slugify'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: async (uri, data) => {
    data._computed.adTags = data.items.map(item => item.text).join(',');
    return data;
  },
  save: async (uri, data) => {
    for (const aTag of data.items) {
      aTag.text = aTag.text.trim();
      aTag.slug = slugifyService(aTag.text);
    }
    return data;
  }
});
