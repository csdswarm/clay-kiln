#!/usr/bin/env node
'use strict';

const {_has, _set, elasticsearch, parseHost} = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host),
  indexPath = '_doc.properties.stationSyndication.properties.source';

(async function () {
  try {
    console.log('Adding ES mappings for stationSyndication.source');

    const newIndex = await elasticsearch.updateIndex(
      envInfo,
      'published-content',
      {
        shouldUpdate: currentMappings => !_has(currentMappings, indexPath),
        updateMappings: mappings => {
          return _set(mappings, [...indexPath.split(/\./g), 'type'], 'keyword');
        }
      });

    if(newIndex) {
      console.log('Mappings updated.');
    } else {
      console.log('Mapping already exists. Done.');
    }
  } catch (e) {
    console.error('Unable to update ES mappings for stationSyndication.source');
    console.error(e);
  }
})();
