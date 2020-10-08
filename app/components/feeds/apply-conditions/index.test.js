'use strict';

const applyConditions = require('./index'),
  { expect } = require('chai');

const expected = getExpectedQueries();

describe('apply-conditions/index.js', () => {
  it('should apply exclude', () => {
    const query = {};

    applyConditions(query, { exclude: { tag: 'sports' } });

    expect(query).to.deep.equal(expected.exclude);
  });

  it('should apply filter', () => {
    const query = {};

    applyConditions(query, { filter: { tag: 'sports' } });

    expect(query).to.deep.equal(expected.filter);
  });

  describe('andFilter', () => {
    it('should apply a single value', () => {
      const query = {};

      applyConditions(query, { andFilter: { tag: 'sports' } });

      expect(query).to.deep.equal(expected.andFilter.one);
    });

    it('should apply multiple values', () => {
      const query = {};

      applyConditions(query, { andFilter: { tag: ['sports', 'eagles'] } });

      expect(query).to.deep.equal(expected.andFilter.multiple);
    });
  });

  describe('orFilter', () => {
    it('should apply a single value', () => {
      const query = {};

      applyConditions(query, { orFilter: { tag: 'sports' } });

      expect(query).to.deep.equal(expected.orFilter.one);
    });

    it('should apply multiple values', () => {
      const query = {};

      applyConditions(query, { orFilter: { tag: ['sports', 'music'] } });

      expect(query).to.deep.equal(expected.orFilter.multiple);
    });
  });
});

function getExpectedQueries() {
  return {
    exclude: {
      body: {
        query: {
          bool: {
            must_not: [{ match: { 'tags.normalized': 'sports' } }]
          }
        }
      }
    },
    filter: {
      body: {
        query: {
          bool: {
            should: [{ match: { 'tags.normalized': 'sports' } }],
            minimum_should_match: 1
          }
        }
      }
    },
    andFilter: {
      one: {
        body: {
          query: {
            bool: {
              must: [{ match: { 'tags.normalized': 'sports' } }]
            }
          }
        }
      },
      multiple: {
        body: {
          query: {
            bool: {
              must: [
                { match: { 'tags.normalized': 'sports' } },
                { match: { 'tags.normalized': 'eagles' } }
              ]
            }
          }
        }
      }
    },
    orFilter: {
      one: {
        body: {
          query: {
            bool: {
              should: [{ match: { 'tags.normalized': 'sports' } }],
              minimum_should_match: 1
            }
          }
        }
      },
      multiple: {
        body: {
          query: {
            bool: {
              should: [
                { match: { 'tags.normalized': 'sports' } },
                { match: { 'tags.normalized': 'music' } }
              ],
              minimum_should_match: 1
            }
          }
        }
      }
    }
  };
}
