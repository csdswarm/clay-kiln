'use strict';
const getRecirculation = require('../../services/universal/recirculation'),
  logger = require('../../services/universal/log'),
  { isComponent } = require('clayutils'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  log = logger.setup({ file: __filename }),
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  maxResults = 10,
  /**
   * Converts an object with true/false values into an array of "true" keys
   *
   * @param {object} obj
   * @returns {array}
   */
  boolObjectToArray = (obj) => Object.entries(obj || {}).map(([key, bool]) => bool && key).filter(value => value),
  /**
   * Replace https with http
   *
   * @param {string} url
   * @returns {string}
   */
  cleanUrl = url => url.split('?')[0].replace('https://', 'http://'),
  /**
   * Ensures the url exists and it is not a component ref
   *
   * @param {string} url
   * @returns {boolean}
   */
  validUrl = url => url && !isComponent(url);

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async (ref, data, locals) => {
  try {
    const filters = {
        contentTypes: boolObjectToArray(data.contentType),
        sectionFronts: { condition: 'must', value: data.sectionFront },
        secondarySectionFronts: data.secondarySectionFronts,
        tags: data.tags
      },
      excludes = {
        canonicalUrls: [locals.url, ...data.items.map(item => item.canonicalUrl)].filter(validUrl).map(cleanUrl),
        secondarySectionFronts: boolObjectToArray(data.excludeSecondarySectionFronts),
        sectionFronts: boolObjectToArray(data.excludeSectionFronts),
        tags: (data.excludeTags || []).map(tag => tag.text)
      },
      articles = await getRecirculation(filters, excludes);

    data.articles = data.items.concat(articles).slice(0, maxResults);
  } catch (e) {
    log('error', `There was an error querying items from elastic - ${e.message}`, e);
  }

  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }
  data.items = await Promise.all(data.items.map(async (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields);

    return  {
      ...item,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl ,
      sectionFront: result.sectionFront
    };
  }));

  return data;
};
