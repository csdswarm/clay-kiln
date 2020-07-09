const {v1: {
    parseHost, 
    elasticsearch
  } } = require('../migration-utils'),
  host = process.argv.slice(2)[0] || 'clay.radio.com',
  parsedHost = parseHost(host);

elasticsearch.updateIndex(parsedHost, 'published-content', {
  shouldUpdate: currentIndexMappings => !currentIndexMappings._doc.properties.stationSyndication.properties.importer,
  updateMappings: currentIndexMappings => {
    return { 
      _doc: {
        ...currentIndexMappings._doc,
        properties: {
          ...currentIndexMappings._doc.properties,
          stationSyndication: {
            ...currentIndexMappings._doc.properties.stationSyndication,
            properties: {
              ...currentIndexMappings._doc.properties.stationSyndication.properties,
              importer: {
                type: 'boolean'
              }
            }
          }
        }
      }
    };
  }
});