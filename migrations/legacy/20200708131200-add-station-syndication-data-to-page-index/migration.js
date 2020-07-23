'use strict';

const migrationUtils = require('../migration-utils'),
  { _get, _set } = migrationUtils.v1,
  { elasticsearch, parseHost } = migrationUtils.v2,
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host),
  index = 'pages',
  pathToStationSyndication = '_doc.properties.stationSyndication',
  pathToStationAnalyzer = 'analysis.analyzer.station_analyzer',
  shouldUpdate = (currentMappings, currentSettings) => {
    return !(
      _get(currentMappings, pathToStationSyndication)
      && _get(currentSettings, pathToStationAnalyzer)
    );
  },
  addStationSyndication = currentMappings => {
    return _set(currentMappings, pathToStationSyndication, {
      type: 'nested',
      properties: {
        callsign: {
          type: 'keyword',
          fields: {
            normalized: {
              type: 'text',
              analyzer: 'station_analyzer'
            }
          }
        },
        importer: {
          type: 'boolean'
        },
        sectionFront: {
          type: 'keyword'
        },
        secondarySectionFront: {
          type: 'keyword'
        },
        source: {
          type: 'keyword'
        },
        stationSlug: {
          type: 'keyword'
        },
        syndicatedArticleSlug: {
          type: 'text'
        }
      }
    });
  },
  addStationAnalyzer = currentSettings => {
    const filter = {
        my_ascii_folding: {
          type: 'asciifolding',
          preserve_original: 'true'
        }
      },
      charFilter = {
        remove_whitespace: {
          pattern: '\\s+',
          type: 'pattern_replace',
          replacement: '-'
        },
        remove_punctuation: {
          pattern: "[.,/#!$%\\^&\\*;:{}=\\-_`~()']",
          type: 'pattern_replace',
          replacement: ''
        }
      },
      stationAnalyzer = {
        station_analyzer: {
          filter: [
            'standard',
            'my_ascii_folding',
            'lowercase'
          ],
          char_filter: [
            'remove_whitespace',
            'remove_punctuation'
          ],
          tokenizer: 'standard'
        }
      };

    // adding settings for station_analyzer and the custom filters it depends on
    return {
      ...currentSettings,
      analysis: {
        ...currentSettings.analysis,
        analyzer: {
          ...(currentSettings.analysis && currentSettings.analysis.analyzer),
          ...stationAnalyzer
        },
        char_filter: charFilter,
        filter
      }
    };
  };

(async function() {
  try {
    console.log('Updating ES mappings for stationSyndication...');

    const newIndex = await elasticsearch.updateIndex(
      envInfo.es,
      index,
      {
        shouldUpdate,
        updateMappings: addStationSyndication,
        updateSettings: addStationAnalyzer
      }
    );

    if (newIndex) {
      console.log(`stationSyndication mapping added and the new index '${newIndex}' was created`);
    } else {
      console.log(`stationSyndication mapping was already added, no index was created`);
    }
  } catch (e) {
    console.error(`Unable to update ES mappings for stationSyndication in '${index}' index`);
    console.error(e);
  }
})();
