'use strict';

const { getArticleData } = require('../universal/recirc/recirc-cmpt'),
  _get = require('lodash/get'),
  { PAGE_TYPES } = require('../universal/constants'),
  urlPatterns = require('../universal/url-patterns'),
  log = require('../universal/log').setup({ file: __filename }),

  /**
   * generates a url based on the component's type and data
   *
   * @param {String} componentName
   * @param {Object} data
   * @returns {String}
   */
  componentSlugUrl = (componentName = '', data = {}) => {
    if (componentName === PAGE_TYPES.ARTICLE) {
      return urlPatterns.article(data);
    }

    if (componentName === PAGE_TYPES.GALLERY) {
      return urlPatterns.gallery(data);
    }

    return '';
  };

/**
 * Makes a request with the component's canonicalUrl to determine whether
 * a published version exists or not
 * @param {String} ref component uri
 * @param {Object} data component data
 * @param {Object} locals kiln site locals
 * @param {String} componentName type of component (ie: article, gallery, etc...)
 * @returns {Boolean} whether a component at that url exists or not
 */
module.exports = (
  ref = '',
  data = {},
  locals,
  componentName = ''
) => {
  const
    prefix = _get(locals, 'site.prefix', ''),
    protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:',
    urlData = {
      prefix,
      sectionFront: data.sectionFront,
      secondarySectionFront: data.secondarySectionFront,
      slug: data.slug
    },
    possibleURL = `${protocol}//${componentSlugUrl(componentName, urlData)}`,
    // when the fields argument is falsey it means all fields
    allFields = null;

  return getArticleData(
    ref,
    { url: possibleURL },
    locals,
    allFields,
    { shouldDedupeContent: false }
  )
    .catch(err => {
      log('error', `error when getting the article data for '${possibleURL}'`, err);
    })
    .then(res => !!res);
};
