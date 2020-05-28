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
      },
      // transform all data to adhere to the new mapping
      `
        ArrayList list = new ArrayList();
        for (item in (ctx._source.stationSyndication ?: [])) {
          if (item instanceof String) {
            HashMap map = new HashMap();
            map.put("callsign", item);
            list.add(map);
          } else {
            list.add(item);
          }
        }
        ctx._source.stationSyndication = list;
      `
    );

    console.log('Mappings updated.');
  } catch (e) {
    console.error('Unable to update ES mappings for stationSyndication');
    console.error(e);
  }
})();
