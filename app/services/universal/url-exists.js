'use strict';

const { getArticleData } = require('../universal/recirc-cmpt'),
  { PAGE_TYPES } = require('../universal/constants'),
  urlPatterns = require('../universal/url-patterns'),
  componentSlugUrl = (componentName = '', data = {}) => {
    if (componentName === PAGE_TYPES.ARTICLE) {
      return data.secondarySectionFront
        ? urlPatterns.articleSecondarySectionFrontSlugPattern(data)
        : urlPatterns.articleSlugPattern(data);
    }

    if (componentName === PAGE_TYPES.GALLERY) {
      return data.secondarySectionFront
        ? urlPatterns.gallerySecondarySectionFrontSlugPattern(data)
        : urlPatterns.gallerySlugPattern;
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
  locals = {},
  componentName = ''
) => {
  const { site:
      { prefix }
    } = locals,
    protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:',
    urlData = {
      prefix,
      sectionFront: data.sectionFront,
      secondarySectionFront: data.secondarySectionFront,
      slug: data.slug
    },
    possibleURL = `${protocol}//${componentSlugUrl(componentName, urlData)}`;

  return getArticleData(ref, {
    url: possibleURL
  }, locals)
    .catch(err => console.error(err))
    .then(res => !!res);
};
