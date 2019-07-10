'use strict';

module.exports.save = function (uri, data) {
  for (const aTag of data.items) {
    aTag.text = aTag.text.trim();
  }

  return data;
};
