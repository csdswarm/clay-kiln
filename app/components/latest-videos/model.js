'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront',
    'contentType'
  ],
  maxItems = 6,
  excludedTags = ({ filterTags }) => (filterTags || []).map(({ text }) => text),
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async (ref, data) => {
    data.articles = data._computed.content;

    return data;
  };

module.exports = recirculationData({
  contentKey: 'content',
  elasticFields,
  mapDataToFilters: (uri, data, locals) => ({
    filters: {
      videos: {
        value: `${locals.site.host}\/_components\/brightcove\/instances.*`
      }
    },
    excludes: {
      tags: excludedTags(data)
    },
    maxItems
  }),
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      sectionFront: item.overrideSectionFront || result.sectionFront,
      date: item.overrideDate || result.date
    });
  },
  render
});
