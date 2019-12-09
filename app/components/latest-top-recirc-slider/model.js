'use strict';
const { recirculationComponent } = require('../../services/universal/recirculation'),
  { isComponent } = require('clayutils'),
  /**
   * Converts an object with true/false values into an array of "true" keys
   *
   * @param {object} obj
   * @returns {array}
   */
  boolObjectToArray = (obj) => Object.entries(obj || {}).map(([key, bool]) => bool && key).filter(value => value),
  /**
   * Replace https with http
   *
   * @param {string} url
   * @returns {string}
   */
  cleanUrl = url => url.split('?')[0].replace('https://', 'http://'),
  /**
   * Ensures the url exists and it is not a component ref
   *
   * @param {string} url
   * @returns {boolean}
   */
  validUrl = url => url && !isComponent(url);

module.exports = recirculationComponent({
  mapDataToFilters: (ref, data, locals) => ({
    filters: {
      contentTypes: boolObjectToArray(data.contentType),
      sectionFronts: { condition: 'must', value: data.sectionFront },
      secondarySectionFronts: data.secondarySectionFronts,
      tags: data.tags
    },
    excludes: {
      canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
      secondarySectionFronts: boolObjectToArray(data.excludeSecondarySectionFronts),
      sectionFronts: boolObjectToArray(data.excludeSectionFronts),
      tags: (data.excludeTags || []).map(tag => tag.text)
    }
  })
});
