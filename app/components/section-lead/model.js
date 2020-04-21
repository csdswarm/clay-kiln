'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { toPlainText } = require('../../services/universal/sanitize'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  qs = require('qs'),
  { getComponentName } = require('clayutils'),
  elasticFields = [
    'date',
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  MEDIA_SIZES = {
    small: 'max-width: 360px',
    mediumSmall: 'max-width: 480px',
    medium: 'max-width: 1023px',
    large: 'max-width: 1279px',
    default: 'min-width: 1280px'
  },
  isMultiColumn = data => data._computed.parents.some(parent => getComponentName(parent) === 'multi-column'),
  asQuery = value => qs.stringify(value, { encode: false }),
  /**
   * Gets the number of items to display
   *
   * @param {object} data
   * @returns {number}
   */
  getMaxItems = (data) => isMultiColumn(data) ? 2 : 3,
  /**
   * Takes an object with various sizes set and converts them to
   * an array of values for picture > source elements
   * @param {object} sizes
   * @returns {{srcParams: *, media: *}[]}
   */
  mapSizes = (sizes) => {
    return Object.entries(sizes).map(([key, value]) => ({
      media: MEDIA_SIZES[key],
      srcParams: asQuery(value)
    }));
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: (uri, data) => ({
    maxItems: getMaxItems(data)
  }),

  /**
   * @param {object} locals
   * @param {object} result The validated item
   * @param {object} item
   * @returns {object}
   */
  mapResultsToTemplate: async (locals, result, item = {}) => {
    const primarySectionFronts = await retrieveList('primary-section-fronts', { locals });

    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

    return {
      ...item,
      date: result.date,
      uri: result._id,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      label: item.overrideLabel || getSectionFrontName(result.sectionFront, primarySectionFronts),
      plaintextTitle: toPlainText(item.title)
    };
  },

  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render: (ref, data, locals) => {
    const squareCrop = '1:1,offset-y0',
      wideCrop = '8:5.1,offset-y0',
      defaultImageSizes = {
        mediumSmall: { width: 440, crop: wideCrop },
        medium: { width: 343, crop: wideCrop },
        large: { width: 140, crop: '140:121,offset-y0' },
        default: { width: 220, crop: wideCrop }
      },
      primaryImageSizes = {
        mediumSmall: { width: 480, crop: wideCrop },
        medium: { width: 1023, crop: wideCrop },
        large: { width: 620, crop: '620:439,offset-y0' },
        default: { width: 780, crop: wideCrop }
      };

    data.primaryStoryLabel = data.primaryStoryLabel
      || locals.secondarySectionFront
      || locals.sectionFront
      || data.tag;

    if (isMultiColumn(data)) {
      Object.assign(defaultImageSizes, {
        small: { width: 85, crop: squareCrop },
        mediumSmall: { width: 115, crop: squareCrop },
        medium: { width: 222, crop: wideCrop },
        large: { width: 140, crop: squareCrop }
      });
      Object.assign(primaryImageSizes, {
        small: { width: 360, crop: wideCrop },
        mediumSmall: { width: 480, crop: wideCrop },
        medium: { width: 704, crop: wideCrop },
        large: { width: 300, crop: squareCrop },
        default: { width: 460, crop: squareCrop }
      });

      data._computed.useContentLabel = true;
      data._computed.hideAdRailRight = true;
      data._computed.mcModifier = 'section-lead--multi-column';
    }

    data._computed.storySizes = mapSizes(defaultImageSizes);
    data._computed.storySizeParams = asQuery(defaultImageSizes.default);
    data._computed.primaryStorySizes = mapSizes(primaryImageSizes);
    data._computed.primaryStorySizeParams = asQuery(primaryImageSizes.default);

    return data;
  }
});
