'use strict';

const queryService = require('../../services/server/query'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  contentTypeService = require('../../services/universal/content-type'),
  { toPlainText } = require('../../services/universal/sanitize'),
  qs = require('qs'),
  { isComponent, getComponentName } = require('clayutils'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  maxItems = 3,
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  MEDIA_SIZES = {
    small: 'max-width: 360px',
    mediumSmall: 'max-width: 480px',
    medium: 'max-width: 1023px',
    large: 'max-width: 1279px',
    default: 'min-width: 1280px'
  },
  asQuery = value => qs.stringify(value, { encode: false });

/**
 * Takes an object with various sizes set and converts them to
 * an array of values for picture > source elements
 * @param {object} sizes
 * @returns {{srcParams: *, media: *}[]}
 */
function mapSizes(sizes) {
  return Object.entries(sizes).map(([key, value]) => ({
    media: MEDIA_SIZES[key],
    srcParams: asQuery(value)
  }));
}

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }

  return Promise.all(data.items.map((item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

    return recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields)
      .then((result) => {
        const article = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: item.overrideImage || result.feedImgUrl
        });

        if (article.title) {
          article.plaintextTitle = toPlainText(article.title);
        }

        return article;
      });
  }))
    .then((items) => {
      data.items = items;
      data.primaryStoryLabel = data.primaryStoryLabel || locals.sectionFront || locals.secondarySectionFront || data.tag;

      return data;
    });
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  const inMultiColumn = !!data._computed.parents.find(parent => getComponentName(parent) === 'multi-column'),
    maxCount = inMultiColumn ? 2 : maxItems,
    query = queryService.newQueryWithCount(elasticIndex, maxCount, locals),
    contentTypes = contentTypeService.parseFromData(data),
    squareCrop = '1:1,offset-y0',
    wideCrop = '16:9,offset-y0',
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

  let cleanUrl;

  // items are saved from form, articles are used on FE, and make sure they use the correct protocol
  data.items = data.articles = data.items
    .filter(item => item.canonicalUrl)
    .map(item => ({
      ...item,
      canonicalUrl: item.canonicalUrl.replace(/^http:/, protocol)
    }));

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

  if (!locals || !locals.sectionFront && !locals.secondarySectionFront) {
    return data;
  }

  if (contentTypes.length) {
    queryService.addFilter(query, { terms: { contentType: contentTypes } });
  }

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (locals.secondarySectionFront) {
    queryService.addMust(query, { match: { secondarySectionFront: locals.secondarySectionFront } });
  } else if (locals.sectionFront) {
    queryService.addMust(query, { match: { sectionFront: locals.sectionFront } });
  } else if (data.tag) {
    queryService.addMust(query, { match: { 'tags.normalized': data.tag } });
  }
  queryService.addSort(query, { date: 'desc' });

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  // exclude the curated content from the results
  if (data.items && !isComponent(locals.url)) {
    data.items.forEach(item => {
      if (item.canonicalUrl) {
        cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      }
    });
  }

  // Filter out the following tags
  if (data.filterTags) {
    for (const tag of data.filterTags.map((tag) => tag.text)) {
      queryService.addMustNot(query, { match: { 'tags.normalized': tag } });
    }
  }

  // Filter out the following secondary article type
  if (data.filterSecondarySectionFronts) {
    Object.entries(data.filterSecondarySectionFronts).forEach((secondarySectionFront) => {
      const [ secondarySectionFrontFilter, filterOut ] = secondarySectionFront;

      if (filterOut) {
        queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter } });
      }
    });
  }

  return queryService.searchByQuery(query)
    .then(function (results) {

      data.articles = data.items.concat(results.slice(0, maxCount)).slice(0, maxCount); // show a maximum of maxCount links
      data.primaryStoryLabel = data.primaryStoryLabel || locals.secondarySectionFront || locals.sectionFront || data.tag;
      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};

module.exports = require('../../services/universal/amphora').unityComponent(module.exports);
