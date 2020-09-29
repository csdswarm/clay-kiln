'use strict';

const db = require('../../services/server/db'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { addAmphoraRenderTime } = require('../../services/universal/utils'),
  elasticFields = [
    'date',
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  { render, skipRender } = require('../../services/universal/recirc/latest-components/index'),
  { getComponentName } = require('clayutils'),
  /**
   * Determine if latest-recirculation is within a multi-column
   *
   * @param {object} data
   * @returns {boolean}
   */
  isMultiColumn = (data) => {
    return data._computed.parents.some(ref => getComponentName(ref) === 'multi-column');
  },
  /**
   * Gets the number of items to display
   *
   * @param {object} data
   * @returns {number}
   */
  getMaxItems = (data) => isMultiColumn(data) ? 4 : 5,
  /**
   * latest-recirculation gets additional curated items from the trending-recirculation component
   * This is different from other recirculation components, but has been in place for awhile.  It may be
   * able to be changed
   *
   * @param {object} locals
   * @returns {array} items
   */
  getItemsFromTrendingRecirculation = async (locals) => {
    const trendingRecircRef = `${locals.site.host}/_components/trending-recirculation/instances/default@published`,
      start = new Date();

    try {
      const trendingRecircData = await db.get(trendingRecircRef, locals);

      return trendingRecircData.items;
    } catch (e) {
      if (e.name === 'NotFoundError') {
        return [];
      } else {
        throw e;
      }
    } finally {
      addAmphoraRenderTime(locals, {
        label: 'db.get trendingRecircRef',
        ms: new Date() - start
      });
    }
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: async (uri, data, locals) => {
    return {
      curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)],
      maxItems: getMaxItems(data),
      isRdcContent: !(locals.station.id && locals.station.website)
    };
  },
  render: (uri, data, locals) => {

    if (data.populateFrom ===  'tag') {
      data._computed.tagText = data.tag[0].text;
    }
    
    return render(uri, data, locals);
  },
  shouldAddAmphoraTimings: true,
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      canonicalUrl: item.url || result.canonicalUrl,
      date: item.overrideDate || result.date,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label: result.syndicatedLabel || result.label,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      sectionFront: item.overrideSectionFront || result.sectionFront
    });
  },
  skipRender
});
