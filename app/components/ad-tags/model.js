'use strict';

module.exports.save = function (uri, data) {
  for (const aTag of data.items) {
    aTag.text = aTag.text.trim();
  }

  data.normalizedAdTagsStr = data.items.map(item => item.text.replace(/ /g, '-')).join(',');

  return data;
};
