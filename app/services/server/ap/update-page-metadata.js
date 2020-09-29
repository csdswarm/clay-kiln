'use strict';

const _merge = require('lodash/merge'),
  axios = require('axios'),
  db = require('amphora-storage-postgres');

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

/**
 * gets the originally published url for a station
 *
 * note: I think the term 'syndicatedUrl' sounds backwards but it is what it is.
 *
 * @param {object} pageData
 */
async function getSyndicatedUrl(pageData) {
  const pageRef = pageData._ref.replace('@published', ''),
    { data } = await axios.get(`${protocol}://${pageRef}/meta`);

  return data.url;
}

/**
 * returns the object representing the published metaUrl
 *
 * @param {object} metaUrl
 * @returns {object}
 */
async function getPublishedMetaUrl(metaUrl) {
  const _ref = metaUrl._ref + '@published',
    dbResult = await db.raw(
      `
        select data
        from components."meta-url"
        where id = ?
      `,
      [_ref]
    ),
    publishedMetaUrl = Object.assign({ _ref }, dbResult.rows[0].data);

  return publishedMetaUrl;
}

/**
 * sets metaUrl.syndicatedUrl if not already
 *
 * note: this must be done after publish to ensure we have a published url to
 *   set it to.  This means we need to update both the latest and published
 *   versions of the component.
 *
 * @param {object} articleData - this is mutated to ensure metaUrl.syndicatedUrl exists
 */
async function ensureSyndicatedUrl(articleData) {
  const { metaUrl, pageData } = articleData;

  if (metaUrl.syndicatedUrl) {
    return;
  }

  const [syndicatedUrl, publishedMetaUrl] = await Promise.all([
    getSyndicatedUrl(pageData),
    getPublishedMetaUrl(metaUrl)
  ]);

  Object.assign(metaUrl, { syndicatedUrl });

  Object.assign(publishedMetaUrl, {
    // ideally we'd keep the _version property in the meta components so
    //   upgrades aren't ran multiple times.  Til that gets refactored however,
    //   we need to explicitly add defaultSyndicatedUrl here.
    defaultSyndicatedUrl: syndicatedUrl,
    syndicatedUrl
  });

  await Promise.all([
    update(metaUrl),
    update(publishedMetaUrl)
  ]);
}

module.exports = updatePageMetadata;

Object.assign(module.exports, { ensureSyndicatedUrl });
