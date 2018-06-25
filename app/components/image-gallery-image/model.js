'use strict';

const mediaplay = require('../../services/universal/media-play'),
  striptags = require('striptags'),
  sanitize = require('../../services/universal/sanitize'),
  allowedTags = ['strong', 'em', 'a'], // tags allowed in caption, credit, creditOverride
  cleanText = (text) => sanitize.toSmartText(striptags(text, allowedTags));

module.exports.save = (uri, data) => {
  if (!data.url) return data;

  return mediaplay.getMediaplayMetadata(data.url).then((metadata) => {
    const { width, height } = metadata.dimensions || {},
      credit = cleanText(metadata.credit);

    return Object.assign({}, data, { width, height, credit });
  });
};

