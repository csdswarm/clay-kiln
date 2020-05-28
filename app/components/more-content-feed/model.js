'use strict';
const _get = require('lodash/get'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { sendError } = require('../../services/universal/cmpt-error'),
  maxItems = 10,
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront',
    'date',
    'lead._ref',
    'subHeadline',
    'contentType'
  ],
  min = (...args) => Math.min(...args.filter(arg => typeof arg === 'number')),
  getLeadComponentName = (lead) => {
    return _get(lead, '[0]._ref') ? _get(lead, '[0]._ref').split('/')[2] : lead;
  },
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise<object> | object}
   */
  render = async function (ref, data, locals) {
    const isDynamicAuthorPage = _get(locals, 'params.author');

    data.dynamicTagPage = _get(locals, 'params.dynamicTag', _get(locals, 'params.stationSlug'));

    if ((data.dynamicTagPage || isDynamicAuthorPage) && data._computed.content.length === 0) {
      sendError(`${data.populateFrom} not found`, 404);
    }

    Object.assign(data._computed, {
      lazyLoads: Math.max(Math.ceil((min(data.maxLength, 30) - maxItems) / data.pageLength || 5), 0)
    });

    return data;
  };

module.exports = recirculationData({
  contentKey: 'content',
  elasticFields,
  mapDataToFilters: (uri, data, locals) => ({
    pagination: {
      page: _get(locals, 'page')
    }
  }),
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      subHeadline: item.overrideSubHeadline || result.subHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      sectionFront: item.overrideSectionFront || result.sectionFront,
      date: item.overrideDate || result.date,
      lead: item.overrideContentType || getLeadComponentName(result.lead)
    });
  },
  render
});
