'use strict';
const slugifyService = require('../../services/universal/slugify');

module.exports.save = function (uri, data) {
  for (const aTag of data.items) {
    aTag.text = aTag.text.trim();
    aTag.slug = slugifyService(aTag.text);
  }
  data.tagString = data.items.map(item => item.text).join(',');
  return data;
};
