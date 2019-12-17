'use strict';
const { recirculationData } = require('../../services/universal/recirculation'),
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
  validUrl = url => url && !isComponent(url);

module.exports = recirculationData({
  mapDataToFilters: (ref, data, locals) => ({
    filters: {
      contentTypes: boolObjectToArray(data.contentType),
      sectionFronts: data.sectionFront,
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
