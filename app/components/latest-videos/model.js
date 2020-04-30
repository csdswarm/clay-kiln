'use strict';

const recircCmpt = require('../../services/universal/recirc/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
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
  save = async (ref, data, locals) => {
    if (!data.items.length || !locals) {
      return data;
    }

    await Promise.all(data.items.map(async item => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

      const searchOpts = {
          includeIdInResult: true,
          shouldDedupeContent: false
        },
        result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts);

      Object.assign(item, {
        uri: result._id,
        primaryHeadline: item.overrideTitle || result.primaryHeadline,
        pageUri: result.pageUri,
        urlIsValid: result.urlIsValid,
        canonicalUrl: result.canonicalUrl,
        feedImgUrl: result.feedImgUrl,
        sectionFront: result.sectionFront
      });

      if (item.title) {
        item.plaintextTitle = toPlainText(item.title);
      }
    }));

    return data;
  },

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
  render,
  save
});
