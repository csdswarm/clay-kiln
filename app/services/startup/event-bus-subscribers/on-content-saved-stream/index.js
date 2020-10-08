'use strict';

const addStationSyndicationToPagesIndex = require('./add-station-syndication-to-pages-index');

/**
 * runs every time a content component is saved
 *
 * @param {object} stream
 */
function onContentSavedStream(stream) {
  stream.each(innerStream => innerStream.toArray(ops => {
    addStationSyndicationToPagesIndex(ops);
  }));
}

module.exports = onContentSavedStream;
