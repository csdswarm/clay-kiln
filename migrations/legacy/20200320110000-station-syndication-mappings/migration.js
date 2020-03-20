'use strict';

const { _set, elasticsearch, parseHost } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host);

(async function() {
  try {
    console.log('Updating ES mappings for stationSyndication...');

    await elasticsearch.updateIndex(
      envInfo,
      'published-content',
      {
        shouldUpdate: () => true,
        updateMappings: mappings => {
          return _set(mappings, '_doc.properties.stationSyndication', {
            type: 'nested',
            properties: {
              stationSlug: {
                type: 'keyword'
              },
              callsign: {
                type: 'keyword',
                fields: {
                  normalized: {
                    type: 'text',
                    analyzer: 'station_analyzer'
                  }
                }
              },
              sectionFront: {
                type: 'keyword'
              },
              secondarySectionFront: {
                type: 'keyword'
              },
              syndicatedArticleSlug: {
                type: 'text'
              }
            }
          });
        }
      }
    );

    console.log('Mappings updated.');
  } catch (e) {
    console.error('Unable to update ES mappings for stationSyndication');
    console.error(e);
  }
})();
