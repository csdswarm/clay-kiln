'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  { DEFAULT_STATION } = require('../../services/universal/constants'),
  render = (ref, data) => {
    // Account for inccorrect formatting of data.tag in the database for previously created content.
    // Instances of data.tag that do not return an empty array, or properly formatted tag array will break the kiln UI.
    // e.g. tag array: data.tag: [] || data.tag: [{ text: 'tag' }].
    if (data.tag.length === 0) {
      data.tag = [];
      return data;
    } else if (Array.isArray(data.tag)) {
      data.tag = data.tag.map((tag) => typeof tag === 'string' ? { text: tag } : tag);
      return data;
    }
    return data;
  };

module.exports = recirculationData({
  mapDataToFilters: (uri, data, locals) => {
    const {
      id: stationId,
      site_slug: stationSlug
    } = locals.station;

    if (stationId !== DEFAULT_STATION.id) {
      return Object.assign({}, data, {
        filters: { stationSlug }
      });
    }

    return data;
  },
  mapResultsToTemplate: async (locals, result, item = {}) => {
    const primarySectionFronts = await retrieveList('primary-section-fronts', { locals }),
      label = getSectionFrontName(result.syndicatedLabel || result.sectionFront, primarySectionFronts);

    return Object.assign(item, {
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      sectionFront: item.overrideSectionFront || result.sectionFront
    });
  },
  render
});
