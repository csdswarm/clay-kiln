'use strict';

const _noop = require('lodash/noop'),
  _reduce = require('lodash/reduce'),
  proxyquire = require('proxyquire').noCallThru(),
  { expect } = require('chai'),

  locals = {},
  nationalStationSlug = '',
  testStation = { name: 'test station', site_slug: 'testSlug' },
  success = [testStation],

  filterDefaults = getFilterDefaults(),
  mockSubscriptions = buildMockSubscriptions(),
  mockContent = getMockContent(),

  makeFn = mock =>
    proxyquire('./get-stations-subscribed-to-content', {
      './amphora-storage-postgres': _noop,
      './get-content-subscriptions': () => mock,
      './station-utils': {
        getAllStations: () => ({
          bySlug: {
            testSlug: testStation
          }
        })
      }
    });

describe('getStationsSubscribedToContent', () => {
  it('should not match per excluded tags', async () => {
    const fn = makeFn(mockSubscriptions.excludeTags);

    expect(await fn(mockContent.default, locals)).to.be.empty;
  });
  it('should not match per excluded section fronts', async () => {
    const fn1 = makeFn(mockSubscriptions.excludeSectionFronts.primary),
      fn2 = makeFn(mockSubscriptions.excludeSectionFronts.secondary),
      [result1, result2] = await Promise.all([
        fn1(mockContent.excludeSectionFront, locals),
        fn2(mockContent.excludeSectionFront, locals)
      ]);

    expect(result1).to.be.empty;
    expect(result2).to.be.empty;
  });
  it('should not match per content type', async () => {
    const fn = makeFn(mockSubscriptions.dontMatchContentType);

    expect(await fn(mockContent.default, locals)).to.be.empty;
  });
  it('should not match per station slug', async () => {
    const fn = makeFn(mockSubscriptions.allContent);

    expect(await fn(mockContent.differentStation, locals)).to.be.empty;
  });

  it('should match per all-content', async () => {
    const fn = makeFn(mockSubscriptions.allContent);

    expect(await fn(mockContent.default, locals)).to.deep.equal(success);
  });
  it('should match per tags', async () => {
    const fn = makeFn(mockSubscriptions.tags);

    expect(await fn(mockContent.default, locals)).to.deep.equal(success);
  });
  it('should match per section fronts', async () => {
    const fn1 = makeFn(mockSubscriptions.sectionFronts.primary),
      fn2 = makeFn(mockSubscriptions.sectionFronts.secondary),
      [result1, result2] = await Promise.all([
        fn1(mockContent.default, locals),
        fn2(mockContent.default, locals)
      ]);

    expect(result1).to.deep.equal(success);
    expect(result2).to.deep.equal(success);
  });
  it('should match per section front and tags', async () => {
    const fn = makeFn(mockSubscriptions.sectionFrontAndTag);

    expect(await fn(mockContent.sectionFrontAndTag, locals)).to.deep.equal(success);
  });
  it('should match per section front or tags', async () => {
    const fn = makeFn(mockSubscriptions.sectionFrontOrTag);

    expect(await fn(mockContent.onlyTag, locals)).to.deep.equal(success);
  });
});

/**
 * this object holds the parts of the subscription filters we need to test
 * @returns {object}
 */
function getBaseMockFilters() {
  return {
    excludeTags: [{
      excludeTags: ['exclude']
    }],
    excludeSectionFronts: {
      primary: [{
        excludeSectionFronts: ['exclude']
      }],
      secondary: [{
        excludeSecondarySectionFronts: ['exclude']
      }]
    },
    dontMatchContentType: [{
      contentType: ['exclude']
    }],
    allContent: [{
      populateFrom: 'all-content'
    }],
    tags: [{
      populateFrom: 'tag',
      tags: ['match']
    }],
    sectionFronts: {
      primary: [{
        sectionFront: 'match',
        populateFrom: 'section-front'
      }],
      secondary: [{
        secondarySectionFront: 'match',
        populateFrom: 'section-front'
      }]
    },
    sectionFrontAndTag: [{
      populateFrom: 'section-front-and-tag',
      tags: ['match'],
      sectionFront: 'match'
    }],
    sectionFrontOrTag: [{
      populateFrom: 'section-front-or-tag',
      tags: ['match'],
      sectionFront: 'dont-match_sub'
    }]
  };
}

/**
 * a reducer function which takes a partial subscription filter and populates
 *   the defaults so it's compatible with our service
 *
 * @param {object} mockFilters
 * @param {object|array} val - either a list of filters or a mock filter entry
 * @param {string} key
 * @returns {object}
 */
function toFullFilter(mockFilters, val, key) {
  if (Array.isArray(val)) {
    mockFilters[key] = val.map(filter => Object.assign(
      {},
      filterDefaults,
      filter
    ));
  } else {
    mockFilters[key] = _reduce(val, toFullFilter, {});
  }

  return mockFilters;
}

/**
 * takes the base filter data we care about then populates the defaults for
 *   compatibility with our service
 *
 * @returns {object}
 */
function buildMockFilters() {
  const mockFilters = _reduce(getBaseMockFilters(), toFullFilter, {});

  return mockFilters;
}

/**
 * a reducer function which takes a 'mock filter' entry and turns it into a mock
 *   subscription, which has the form
 *
 * {
 *   station_slug: <string>
 *   filter: <object>
 * }
 *
 * the subscriptions are held in an array since that's how they will be returned
 *   from the database
 *
 * @param {object} mockSubscriptions
 * @param {object|array} val - either an array containing the filters or an
 *   object which will contain more mock filter entries
 * @param {string} key
 * @returns {object}
 */
function toMockSubscriptions(mockSubscriptions, val, key) {
  if (Array.isArray(val)) {
    mockSubscriptions[key] = val.map(filter => ({
      filter,
      station_slug: testStation.site_slug,
      from_station_slug: nationalStationSlug
    }));
  } else {
    mockSubscriptions[key] = _reduce(val, toMockSubscriptions, {});
  }

  return mockSubscriptions;
}

/**
 * turns the mock filters into mock subscriptions
 *
 * @returns {object}
 */
function buildMockSubscriptions() {
  const mockFilters = buildMockFilters(),
    mockSubscriptions = _reduce(mockFilters, toMockSubscriptions, {});

  return mockSubscriptions;
}

/**
 * @returns {object}
 */
function getMockContent() {
  return {
    default: {
      contentType: 'article',
      textTags: ['match', 'exclude'],
      sectionFront: 'match',
      secondarySectionFront: 'match',
      stationSlug: nationalStationSlug
    },
    differentStation: {
      stationSlug: 'q94'
    },
    excludeSectionFront: {
      sectionFront: 'exclude',
      secondarySectionFront: 'exclude',
      stationSlug: nationalStationSlug
    },
    sectionFrontAndTag: {
      contentType: 'article',
      textTags: ['match'],
      sectionFront: 'match',
      stationSlug: nationalStationSlug
    },
    onlyTag: {
      contentType: 'article',
      textTags: ['match'],
      sectionFront: 'dont-match_content',
      stationSlug: nationalStationSlug
    }
  };
}

/**
 * the default values for a subscription filter
 *
 * @returns {object}
 */
function getFilterDefaults() {
  return {
    tags: [],
    contentType: ['article'],
    populateFrom: '',
    sectionFront: '',
    secondarySectionFront: '',
    excludeTags: [],
    excludeSectionFronts: [],
    excludeSecondarySectionFronts: []
  };
}
