'use strict';

const {
    _get,
    _set,
    elasticsearch,
    parseHost
  } = require('../migration-utils').v1,
  host = process.argv[2],
  pathToHosts = '_doc.properties.hosts',
  shouldUpdate = (currentMappings) => {
    return !_get(currentMappings, pathToHosts);
  },
  addHostProperty = currentMappings => {
    return _set(currentMappings, pathToHosts, {
      type: 'keyword',
      fields: {
        normalized: {
          type: 'text',
          analyzer: 'author_analyzer'
        }
      }
    });
  };

(async function() {
  try {
    const envInfo = parseHost(host),
      newIndex = await elasticsearch.updateIndex(
        envInfo,
        'published-content',
        {
          shouldUpdate,
          updateMappings: addHostProperty
        }
      );

    if (newIndex) {
      console.log(`host mapping added and the new index '${newIndex}' was created`);
    } else {
      console.log(`host mapping was already added, no index was created`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
