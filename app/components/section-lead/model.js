'use strict';

const recircCmpt = require('../../services/universal/recirc/recirc-cmpt'),
  { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { toPlainText } = require('../../services/universal/sanitize'),
  { getSectionFrontName, retrieveList } = require('../../services/server/lists'),
  qs = require('qs'),
  { cleanUrl, boolKeys } = require('../../services/universal/utils'),
  { getComponentName, isComponent } = require('clayutils'),
  isValidUrl = url => url && !isComponent(url),
  filteredSecondarySectionFronts = ({ filterSecondarySectionFronts }) => boolKeys(filterSecondarySectionFronts || {}),
  filteredTags = ({ filterTags }) => (filterTags || []).map(({ text }) => text),
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
  asQuery = value => qs.stringify(value, { encode: false }),
  /**
   * Gets the number of items to display
   *
   * @param {boolean} multiColumn
   * @returns {number}
   */
  getMaxItems = (multiColumn) => multiColumn ? 2 : 3,
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
  },
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  save = async (ref, data, locals) => {
    if (!data.items.length || !locals) {
      return data;
    }

    const primarySectionFronts = await retrieveList('primary-section-fronts', locals);

    data.items = await Promise.all(data.items.map(async (item) => {
      item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
      const searchOpts = {
          includeIdInResult: true,
          shouldDedupeContent: false
        },
        result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts);

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
    }));

    return data;
  },
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render = async (ref, data, locals) => {
    const inMultiColumn = data._computed.parents.some(parent => getComponentName(parent) === 'multi-column'),
      squareCrop = '1:1,offset-y0',
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

    if (inMultiColumn) {
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
  };

module.exports = recirculationData({
  elasticFields,
  mapDataToFilters: (uri, data, locals) => ({
    curated: data.items,
    maxItems: getMaxItems(data),
    filters: { contentTypes: boolKeys(data.contentType) },
    excludes: {
      canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(isValidUrl).map(cleanUrl),
      ...{
        secondarySectionFronts: filteredSecondarySectionFronts(data),
        tags: filteredTags(data)
      }
    }
  }),
  render,
  save
});
