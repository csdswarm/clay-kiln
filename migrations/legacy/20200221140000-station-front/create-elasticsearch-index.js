'use strict';

const { parseHost, httpRequest } = require('../migration-utils').v1;
const INDEX = 'published-stations';

async function createElasticsearchIndex(host) {
  const { es: { http, hostname } } = parseHost(host);

  console.log('Creating new Elasticsearch index...');

  const body = {
    mappings: {
      _doc: {
        dynamic: false,
        properties: {
          stationCallsign: {
            type: 'keyword'
          },
          stationSlug: {
            type: 'keyword'
          }
        }
      }
    }
  };

  try {
    await httpRequest({
      http,
      method: 'PUT',
      url: `${http}://${hostname}:9200/${INDEX}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });
  } catch (e) {
    throw new Error('Could not create Elasticsearch index');
  }

  console.log('Created new Elasticsearch index.');
}

module.exports = createElasticsearchIndex;
