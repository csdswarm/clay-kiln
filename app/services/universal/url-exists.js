'use strict';

const { getArticleData } = require('../universal/recirc-cmpt'),
  { pageTypes } = require('../universal/constants'),
  urlPatterns = require('../universal/url-patterns'),
  componentSlugUrl = (componentName = '', data = {}) => {
    if (componentName === pageTypes.ARTICLE) {
      return data.secondarySectionFront
        ? urlPatterns.articleSecondarySectionFrontSlugPattern(data)
        : urlPatterns.articleSlugPattern(data);
    }

    if (componentName === pageTypes.GALLERY) {
      return data.secondarySectionFront
        ? urlPatterns.gallerySecondarySectionFrontSlugPattern(data)
        : urlPatterns.gallerySlugPattern;
    }

    return '';
  };

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
