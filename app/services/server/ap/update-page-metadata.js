'use strict';

const _merge = require('lodash/merge'),
  axios = require('axios');

const {
  CLAY_ACCESS_KEY: accessKey,
  CLAY_SITE_PROTOCOL: protocol
} = process.env;

/**
 * updates the page's meta data components
 *
 * note: meta-url and meta-tags do not need to be updated since the default
 *   values suffice
 *
 * @param {object} articleData - this is mutated with the derived meta properties
 * @returns {Promise<object[]>}
 */
function updatePageMetadata(articleData) {
  mergeDerivedProperties(articleData);

  return Promise.all([
    update(articleData.metaDescription),
    update(articleData.metaImage),
    update(articleData.metaTags),
    update(articleData.metaTitle)
  ]);
}

/**
 * merges the meta properties into the article
 *
 * @param {object} articleData - this is mutated
 */
function mergeDerivedProperties(articleData) {
  const { article } = articleData;

  _merge(articleData, {
    metaDescription: {
      description: article.pageDescription
    },
    metaImage: {
      imageUrl: article.feedImgUrl
    },
    metaTags: {
      authors: [{
        slug: 'the-associated-press',
        text: 'The Associated Press'
      }],
      contentTagItems: article.tags.items,
      contentType: article.contentType,
      noIndexNoFollow: true,
      publishDate: article.date,
      secondarySectionFront: article.secondarySectionFront,
      sectionFront: article.sectionFront
    },
    metaTitle: {
      kilnTitle: article.headline,
      ogTitle: article.headline,
      title: article.headline,
      twitterTitle: article.headline
    }
  });
}

/**
 * updates the meta data
 *
 * @param {object} metaData
 * @returns {Promise<object>}
 */
function update(metaData) {
  const { _ref, ...data } = metaData;

  return axios.put(`${protocol}://${_ref}`, data, {
    headers: { Authorization: `token ${accessKey}` }
  });
}

module.exports = updatePageMetadata;
