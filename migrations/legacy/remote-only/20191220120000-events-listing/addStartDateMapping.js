'use strict';

const {
    _get,
    _set,
    elasticsearch,
    parseHost
  } = require('../migration-utils').v1,
  host = process.argv[2],
  pathToStartDate = '_doc.properties.startDate',
  shouldUpdate = currentMappings => {
    return !_get(currentMappings, pathToStartDate);
  },
  addStartDateProperty = currentMappings => {
    return _set(currentMappings, pathToStartDate, {
      type: 'date'
    });
  };

run()

async function run() {
  try {
    const envInfo = parseHost(host),
      newIndex = await elasticsearch.updateIndex(
        envInfo,
        'published-content',
        {
          shouldUpdate,
          updateMappings: addStartDateProperty
        }
      );

    if (newIndex) {
      console.log(`startDate mapping added and the new index '${newIndex}' was created`);
    } else {
      console.log(`startDate mapping was already added, no index was created`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
