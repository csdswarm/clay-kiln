'use strict';

const {
    _get,
    _set,
    elasticsearch,
    parseHost
  } = require('../migration-utils').v1,
  host = process.argv[2],
  pathToStationSlug = '_doc.properties.stationSlug',
  pathToLowercase = 'analysis.normalizer.lowercase',
  shouldUpdate = (currentMappings, currentSettings) => {
    return !(
      _get(currentMappings, pathToStationSlug)
      && _get(currentSettings, pathToLowercase)
    );
  },
  addStationSlugProperty = currentMappings => {
    return _set(currentMappings, pathToStationSlug, {
      type: 'keyword',
      normalizer: 'lowercase'
    });
  },
  addLowercaseNormalizer = currentSettings => {
    return _set(currentSettings, pathToLowercase, {
      type: 'custom',
      filter: ['lowercase']
    });
  };

run()

async function run() {
  try {
    const envInfo = parseHost(host),
      newIndex = await elasticsearch.updateIndex(
        envInfo,
        'pages',
        {
          shouldUpdate,
          updateMappings: addStationSlugProperty,
          updateSettings: addLowercaseNormalizer
        }
      );

    if (newIndex) {
      console.log(`stationSlug mapping added and the new index '${newIndex}' was created`);
    } else {
      console.log(`stationSlug mapping was already added, no index was created`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
