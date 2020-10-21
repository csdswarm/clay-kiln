'use strict';

const proxyquire = require('proxyquire').noCallThru(),
  { expect } = require('chai');

const getRenderQuery = proxyquire('./get-render-query', {
    '../../services/server/query': (index, locals, query) => ({
      index,
      type: '_doc',
      body: { query }
    })
  }),
  feedData = getFeedData(),
  expectedQuery = getExpectedQuery();

describe('get-render-query', () => {
  // these tests use a snapshot of their feed's instance data

  describe('reversechron', () => {
    it('should get the default render query', () => {
      const renderQuery = getRenderQuery(feedData.reversechron, {});

      expect(renderQuery).to.deep.equal(expectedQuery.reversechron.default);
    });

    it('should add conditions per filters', () => {
      const renderQuery = getRenderQuery(feedData.reversechron, {
        filter: { tag: 'sports' }
      });

      expect(renderQuery).to.deep.equal(expectedQuery.reversechron.withFilters);
    });
  });


  it('should get the default msn render query', () => {
    const renderQuery = getRenderQuery(feedData.msn, {});

    expect(renderQuery).to.deep.equal(expectedQuery.msn);
  });
});

function getFeedData() {
  return {
    reversechron: {
      meta: {
        link: 'https://clay.radio.com',
        title: 'Radio.com Reverse Chron Feed',
        renderer: 'rss',
        contentType: 'application/rss+xml',
        description: 'Most recent content from Radio.com',
        fileExtension: 'rss'
      },
      index: 'published-content',
      query: {
        size: 20,
        sort: {
          date: 'desc'
        }
      },
      transform: 'article'
    },
    msn: {
      meta: {
        link: 'https://clay.radio.com',
        title: 'Radio.com Msn Rss Feed',
        renderer: 'rss',
        contentType: 'rss',
        description: 'Most recent content from Radio.com for Msn',
        fileExtension: 'rss'
      },
      index: 'published-content',
      query: {
        size: 25,
        sort: {
          date: 'desc'
        },
        query: {
          bool: {
            filter: [
              { match: { contentType: 'article' } },
              { match: { 'feeds.msn': true } },
              { range: { msnTitleLength: { gt: 20 } } },
              { bool: { must_not: { term: { noIndexNoFollow: true } } } },
              { terms: { contentType: ['article', 'gallery'] } }
            ],
            must: [
              {
                bool: {
                  should: [
                    { match: { stationSlug: '' } },
                    { bool: { must_not: { exists: { field: 'stationSlug' } } } }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        }
      },
      format: 'msn',
      transform: 'article'
    }
  };
}

function getExpectedQuery() {
  return {
    reversechron: {
      default: {
        index: 'published-content',
        type: '_doc',
        body: {
          query: {
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      { match: { stationSlug: '' } },
                      { bool: { must_not: { exists: { field: 'stationSlug' } } } }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          },
          size: 20,
          sort: [{ date: 'desc' }]
        }
      },
      withFilters: {
        index: 'published-content',
        type: '_doc',
        body: {
          query: {
            bool: {
              should: [{ match: { 'tags.normalized': 'sports' } }],
              minimum_should_match: 1
            }
          },
          size: 20,
          sort: [{ date: 'desc' }]
        }
      }
    },
    msn: {
      index: 'published-content',
      type: '_doc',
      body: {
        query: {
          bool: {
            filter: [
              { match: { contentType: 'article' } },
              { match: { 'feeds.msn': true } },
              { range: { msnTitleLength: { gt: 20 } } },
              { bool: { must_not: { term: { noIndexNoFollow: true } } } },
              { terms: { contentType: ['article', 'gallery'] } }
            ],
            must: [
              {
                bool: {
                  should: [
                    { match: { stationSlug: '' } },
                    { bool: { must_not: { exists: { field: 'stationSlug' } } } }
                  ],
                  minimum_should_match: 1
                }
              },
              {
                bool: {
                  should: [
                    { match: { stationSlug: '' } },
                    { bool: { must_not: { exists: { field: 'stationSlug' } } } }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        },
        size: 25,
        sort: [{ date: 'desc' }]
      }
    }
  };
}
