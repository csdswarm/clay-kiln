'use strict';

const migrationUtils = require('../../utils/migration-utils'),
  { clayImport } = migrationUtils.v1,
  { parseHost } = migrationUtils.v2;

const { host = 'clay.radio.com', http, hostname } = parseHost(process.argv.slice(2)[0]);

run()

async function run() {
  try {

    const payloadPostup = 
      {
        _components: {
          feeds: {
            instances: {
              postup: {
                meta: {
                  link: `${http}://${hostname}`,
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
                    },
                    bool: {
                      filter: [
                        {
                          match: {
                            'contentType': 'article'
                          }
                        },
                        {
                          match: {
                            'contentType': 'gallery'
                          }
                        },
                        {
                          match: {
                            'contentType': 'contest'
                          }
                        },
                        {
                          match: {
                            'contentType': 'event'
                          }
                        },

                      ]
                    }
                  }
                ,
                results: [],
                transform: 'article'
              }
            }
          }
        }
      }
    const payloadReversechron = 
      {
        _components: {
          feeds: {
            instances: {
              reversechron: {
                meta: {
                  link: `${http}://${hostname}`,
                  title: 'Radio.com Reverse Chron Feed',
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
                  },
                  bool: {
                    filter: [
                      {
                        match: { contentType: 'article' }
                      },
                      {
                        match: { contentType: 'gallery' }
                      },
                    ]
                  }  
                },
                results: []
              }
            }
          }
        }
      }

    await clayImport({ hostUrl: 'https://' + host, payload: payloadPostup });
    await clayImport({ hostUrl: 'https://' + host, payload: payloadReversechron });


    console.log('feeds updated successfully');

  } catch (err) {
    console.error(err);
  }
}
