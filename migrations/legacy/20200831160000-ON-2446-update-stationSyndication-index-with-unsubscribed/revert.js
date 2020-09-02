#!/usr/bin/env node
'use strict';

const {_has, elasticsearch, parseHost} = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host),
  indexPath = '_doc.properties.stationSyndication.properties.unsubscribed';

(async function () {
  try {
    console.log('Remove ES mappings for stationSyndication.unsubscribed');

    const oldIndex = await elasticsearch.revertIndex(
      envInfo,
      'published-content',
      currentMappings => _has(currentMappings, indexPath));

    if(oldIndex) {
      console.log('Mappings reverted.');
    } else {
      console.log('Did not revert mappings. May have already been reverted.');
    }
  } catch (e) {
    console.error('Error occurred while trying to revert ES mappings for stationSyndication.unsubscribed');
    console.error(e);
  }
})();
