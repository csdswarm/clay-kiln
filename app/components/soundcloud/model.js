'use strict';
module.exports.save = function (ref, data) {
  var embedCode = data.embedCode && data.embedCode.match(/\/(tracks|playlists)\/(.*?)&amp;/i),
    srcLink = data.embedCode.match(/src=['"](.*?)['"]/i);

  data.embedType = '';
  data.soundcloudId = '';

  if (embedCode) {
    data.embedType = embedCode[1];
    data.soundcloudId = embedCode[2];

    if (srcLink) {
      // replace the <iframe> embed code in the field with just the src link
      data.embedCode = srcLink[1];
    }
  }
  return data;
};
