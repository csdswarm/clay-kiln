'use strict';

const db = require('../../services/server/db'),
  { getComponentName } = require('clayutils'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { addAmphoraRenderTime } = require('../../services/universal/utils'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  elasticFields = [
    'date',
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  { renderRssFeed, renderStation, skipRender } = require('../../services/universal/recirc/latest-components'),
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
      const trendingRecircData = await db.get(trendingRecircRef);

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
  },

  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    data._computed.isMultiColumn = isMultiColumn(data);

    if (data.populateFrom === 'station' && locals.params) {
      data._computed.station = locals.station.name;
      if (!data._computed.isMigrated) {
        return renderStation(data, locals);// gets the articles from drupal and displays those instead
      }
    }

    if (data.populateFrom === 'rss-feed' && data.rssFeed) {
      return renderRssFeed(data, locals);
    }

    if (data._computed.articles) {
      const primarySectionFronts = await retrieveList(
        'primary-section-fronts', {
          locals,
          shouldAddAmphoraTimings: true
        }
      );

      data._computed.articles = data._computed.articles.map(item => ({
        ...item,
        label: getSectionFrontName(item.sectionFront, primarySectionFronts)
      }));
    }
    // Reset value of customTitle to avoid an override inside the template when the rss option is not selected.
    if (data.populateFrom !== 'rss-feed') {
      data.customTitle = '';
    }
    return data;
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: async (uri, data, locals) => {
    return {
      curated: [...data.items, ...await getItemsFromTrendingRecirculation(locals)],
      maxItems: getMaxItems(data)
    };
  },
  render,
  shouldAddAmphoraTimings: true,
  mapResultsToTemplate: (locals, result, item = {}) => {
    return Object.assign(item, {
      canonicalUrl: item.url || result.canonicalUrl,
      date: item.overrideDate || result.date,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label: item.overrideDate || result.label,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      sectionFront: item.overrideSectionFront || result.sectionFront
    });
  },
  skipRender
});
