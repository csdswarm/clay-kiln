'use strict';
const _pick = require ('lodash/pick'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { cleanUrl } = require('../../services/universal/utils'),
  { isComponent } = require('clayutils'),
  /**
   * Converts an object with true/false values into an array of "true" keys
   *
   * @param {object} obj
   * @returns {array}
   */
  boolObjectToArray = (obj) => Object.entries(obj || {}).map(([key, bool]) => bool && key).filter(value => value),
  /**
   * Ensures the url exists and it is not a component ref
   *
   * @param {string} url
   * @returns {boolean}
   */
  validUrl = url => url && !isComponent(url),
  /**
   * Returns the filters based on the populateFrom field
   *
   * @param {string} populateFrom
   * @returns {array}
   */
  populateFilter = populateFrom => {
    const sectionFronts = ['sectionFronts', 'secondarySectionFronts'],
      tags = ['tags'];

    switch (populateFrom) {
      case 'tag':
        return tags;
      case 'section-front':
        return sectionFronts;
      case 'all-content':
        return [];
      default:
        return [...sectionFronts, ...tags];
    }
  },
  /**
   * Condition needs to be should if section front or tag
   *
   * @param {string} populateFrom
   * @param {any} value
   * @returns {any}
   */
  sectionOrTagCondition = (populateFrom, value) => populateFrom === 'section-front-or-tag' ? { condition: 'should', value } : value;

module.exports = recirculationData({
  mapDataToFilters: (ref, data, locals) => ({
    filters: {
      contentTypes: boolObjectToArray(data.contentType),
      ..._pick({
        sectionFronts: sectionOrTagCondition(data.populateFrom, data.sectionFront),
        secondarySectionFronts: sectionOrTagCondition(data.populateFrom, data.secondarySectionFront),
        tags: sectionOrTagCondition(data.populateFrom, (data.tag || []).map(tag => tag.text))
      }, populateFilter(data.populateFrom))
    },
    excludes: {
      canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
      secondarySectionFronts: boolObjectToArray(data.excludeSecondarySectionFronts),
      sectionFronts: boolObjectToArray(data.excludeSectionFronts),
      tags: (data.excludeTags || []).map(tag => tag.text)
    },
    curated: data.items
  })
});
