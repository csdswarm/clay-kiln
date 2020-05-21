'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront'
  ],
  MAX_ITEMS = 6;

function addParamsAndHttps(arr) {
  return arr
    .filter(item => item.feedImgUrl)
    .map(item => {
      const newItem = { ...item };

      newItem.params = newItem.params || '?article=curated';
      newItem.feedImgUrl = newItem.feedImgUrl.replace('http://', 'https://');
      newItem.feedImgUrl += newItem.feedImgUrl.includes('?') ? '&' : '?';
      return newItem;
    });
}

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: () => ({
    filters: {
      contentTypes: ['article', 'gallery']
    },
    maxItems: MAX_ITEMS
  }),
  render: (ref, data) => {
    data._computed.articles = addParamsAndHttps(data._computed.articles);
    return data;
  }
});
