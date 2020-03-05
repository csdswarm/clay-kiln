'use strict';

const
  _get = require('lodash/get'),
  _pick = require('lodash/pick'),
  transformCard = require('../../services/universal/transform/recirc-to-card'),
  { cleanUrl, boolKeys } = require('../../services/universal/utils'),
  { isComponent } = require('clayutils'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),

  excludedSecondarySectionFronts = ({ excludeSecondarySectionFronts }) => boolKeys(excludeSecondarySectionFronts || {}),
  excludedSectionFronts = ({ excludeSectionFronts }) => boolKeys(excludeSectionFronts || {}),
  excludedTags = ({ excludeTags }) => (excludeTags || []).map(({ text }) => text),
  getSecondarySectionFront = (data, locals) => data.secondarySectionFrontManual || locals.secondarySectionFront,
  getSectionFront = (data, locals) => data.sectionFrontManual || locals.sectionFront,
  isValidUrl = url => url && !isComponent(url),
  sectionOrTagCondition = (populateFrom, value) => populateFrom === 'section-front-or-tag'
    ? { condition: 'should', value }
    : value;

/**
 * Determines the author to use for querying based on priority from data and locals
 * @param {object} data
 * @param {object} locals
 * @returns { string }
 */
function getAuthor(data, locals) {
  const _locals = (...args) => _get(locals, ...args);

  return locals.author || _locals('params.author') || _locals('params.dynamicAuthor') || data.author;
}

/**
 * Composes a list of tags to use for querying based on priority from data and locals
 * @param {object} data
 * @param {object} locals
 * @returns { string[] }
 */
function getTags(data, locals) {
  const _locals = (...args) => _get(locals, ...args);

  let tags = locals.tag || _locals('params.tag') || _locals('params.dynamicTag') || data.tagManual || data.tag;

  if (Array.isArray(tags)) {
    tags = tags.map(({ text }) => text);
  }

  if (typeof tags === 'string') {
    tags = tags.split(',');
  }

  return [].concat(tags);
}

/**
 * Returns the filters that should be used based on the populateFrom field
 *
 * @param {string} populateFrom
 * @returns {array}
 */
function populateFilter(populateFrom) {
  const sources = {
    'all-content': [],
    'section-front': ['sectionFronts', 'secondarySectionFronts'],
    'section-front-and-tag': ['sectionFronts', 'secondarySectionFronts', 'tags'],
    'section-front-or-tag': ['sectionFronts', 'secondarySectionFronts', 'tags'],
    author: ['author'],
    tag: ['tags']
  };

  return sources[populateFrom];
}

module.exports = recirculationData({
  contentKey: 'cards',
  mapDataToFilters: (ref, data, locals) => ({
    filters: {
      contentTypes: boolKeys(data.contentType),
      ..._pick({
        author: sectionOrTagCondition(data.populateFrom, getAuthor(data, locals)),
        sectionFronts: sectionOrTagCondition(data.populateFrom, getSectionFront(data, locals)),
        secondarySectionFronts: sectionOrTagCondition(data.populateFrom, getSecondarySectionFront(data, locals)),
        tags: sectionOrTagCondition(data.populateFrom, getTags(data, locals))
      }, populateFilter(data.populateFrom))
    },
    excludes: {
      canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(isValidUrl).map(cleanUrl),
      ...{
        secondarySectionFronts: excludedSecondarySectionFronts(data),
        sectionFronts: excludedSectionFronts(data),
        tags: excludedTags(data)
      }
    },
    curated: data.items,
    maxItems: 6
  }),
  render(ref, data) {
    const options = {
      track: {
        type: 'feedItem-link',
        'component-name': 'minified-content-feed',
        'component-title': 'Minified Content Feed'
      },
      fields: [ 'category' ]
    };

    data._computed.cards = transformCard('minified', data._computed.cards, options);

    return data;
  }
});
