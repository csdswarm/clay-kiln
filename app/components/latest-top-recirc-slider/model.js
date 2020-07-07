'use strict';
const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  { DEFAULT_STATION } = require('../../services/universal/constants');

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
  }
});
