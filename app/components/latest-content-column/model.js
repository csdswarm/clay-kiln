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
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  { renderRssFeed, renderStation, skipRender } = require('../../services/universal/recirc/latest-components'),

  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async function (ref, data, locals) {
    if (data.populateFrom === 'station' && locals.params) {
      data._computed.station = locals.station.name;
      if (!data._computed.isMigrated) {
        return renderStation(data, locals);// gets the articles from drupal and displays those instead
      }
    }

    if (data.populateFrom === 'rss-feed' && data.rssFeed) {
      return renderRssFeed(data, locals, 3);
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
  mapDataToFilters: (uri, data) => ({
    curated: data.items,
    maxItems: MAX_ITEMS
  }),
  render,
  skipRender
});
