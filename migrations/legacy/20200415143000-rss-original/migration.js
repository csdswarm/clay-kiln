'use strict';
const {
    _has,
    _set,
    elasticsearch,
    parseHost
  } = require('../migration-utils').v1,
  host = process.argv[2],
  shouldUpdate = currentMappings => !_has(currentMappings, '_doc.properties.syndicationStatus'),
  addSyndicationStatusProperty = currentMappings => { 
      return _set(currentMappings, '_doc.properties.syndicationStatus', {type: 'keyword'})
    };

run()

async function run() {
    try {
        const envInfo = parseHost(host);
        const newIndex = await elasticsearch.updateIndex(
            envInfo,
            'published-content',
            {
                shouldUpdate,
                updateMappings: addSyndicationStatusProperty
            }
        );
        if (newIndex) {
            console.log(`syndicationStatus mapping added and the new index '${newIndex}' was created`);
        } else {
            console.log(`syndicationStatus mapping was already addded, no index was created`);
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}
