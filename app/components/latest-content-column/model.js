'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  MAX_ITEMS = 3,
  { render, skipRender } = require('../../services/universal/recirc/latest-components');

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: (uri, data) => ({
    curated: data.items,
    maxItems: MAX_ITEMS
  }),
  render,
  skipRender
});
