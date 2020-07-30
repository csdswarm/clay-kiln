'use strict';

const { clayImport, parseHost } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const envInfo = parseHost(hostUrl);

console.log('Creating PostUp feed instance...');

clayImport({
  hostUrl,
  payload: {
    _components: {
      feeds: {
        instances: {
          postup: {
            meta: {
              link: `${envInfo.http}://${hostUrl}`,
              title: 'Radio.com PostUp Feed',
              renderer: 'rss',
              contentType: 'application/rss+xml',
              description: 'Most recent content from Radio.com',
              fileExtension: 'rss'
            },
            attr: {
              'xmlns:radio': 'https://www.radio.com'
            },
            index: 'published-content',
            query: {
              size: 20,
                sort: {
                date: 'desc'
              }
            },
            results: [],
            transform: 'article'
          }
        }
      }
    }
  }
}).then(() => console.log('PostUp feed instance created.'));
