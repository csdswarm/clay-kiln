'use strict';
const
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  logger = require('../../universal/log'),
  slugifyService = require('../../universal/slugify'),
  { addLazyLoadProperty } = require('../../universal/utils'),
  { get: dbGet, put: dbPut, raw: dbRaw } = require('../db'),
  { getAllStations } = require('../station-utils'),
  { searchByQuery } = require('../query'),

  log = logger.setup({ file: __filename }),
  QUERY_TEMPLATE = {
    index: 'published-content',
    type: '_doc',
    body: {
      query: { term: { 'ap.itemid': '' } },
      size: 1,
      _source: false
    }
  },

  __ = {
    dbGet,
    dbPut,
    dbRaw,
    getAllStations,
    log,
    searchByQuery
  };

// createPage utilizes a number of imports that call io-redis before
// any logic is done to verify that network access exists, so lazy load this
addLazyLoadProperty(__, 'createPage', require('../page-utils'));

/**
 * Checks to see if the AP Content is publishable
 * @param {string[]} editorialtypes
 * @param {string[]} signals
 * @param {string} pubstatus
 * @returns {boolean}
 */
function checkApPublishable({ editorialtypes, pubstatus, signals }) {
  return signals.includes('newscontent') && pubstatus === 'usable' && !editorialtypes.includes('Kill');
}

/**
 * Checks elastic to see if there is an existing article with a matching itemid. If so, this article has been
 * imported before.
 * @param {string} itemid
 * @returns {object|undefined}
 */
async function findExistingArticle({ itemid } = {}) {
  const
    { dbRaw, log, searchByQuery } = __,
    query = _set({ ...QUERY_TEMPLATE }, 'body.query.term[\'ap.itemid\']', itemid);

  try {
    const [existing] = await searchByQuery(query, null, { includeIdInResult: true }),
      { rows } = existing && await dbRaw(`
        SELECT data 
        FROM pages, jsonb_array_elements_text(data->\'main\') article_id
        WHERE article_id = ?`,
      existing._id) || {};

    return rows && rows[0];

  } catch (error) {
    log('error', 'Problem getting existing data from elastic', error);
  }
}

/**
 * Creates a new page and sets the station to the first station slug found
 * @param {object} stationMappings
 * @param {object} locals
 * @returns {Promise<Object>}
 */
async function createNewArticle(stationMappings, locals) {
  const { createPage, dbGet } = __;

  return createPage(
    await dbGet(`${locals.site.host}/_pages/new-two-col`),
    Object.keys(stationMappings)[0] || '',
    locals
  );
}

/**
 * Gets all necessary info to handle updating the page, including the
 * article, meta-title, meta-description, meta-image, meta-tags and tags
 * @param {object} pageData
 * @param {string[]} pageData.head
 * @param {string[]} pageData.main
 * @returns {Promise<object>}
 */
async function getArticleData({ head, main }) {
  const
    { dbGet } = __,
    article = await dbGet(main[0]),
    [
      metaDescription,
      metaImage,
      metaTags,
      metaTitle
    ] = await Promise.all(
      ['description', 'image', 'tags', 'title']
        .map(async name => await dbGet(head.find(text => text.includes(`meta-${name}`))))
    );

  return {
    article,
    metaDescription,
    metaImage,
    metaTags,
    metaTitle
  };
}

/**
 * Determines which stationMappings have been added to the article since the last time
 * If the article was just created, then all station mappings will be incuded and
 * merged with correct station info
 * @param {object} article
 * @param {object[]} stationMappings
 * @param {object} locals
 * @returns {Promise<unknown[]>}
 */
async function getNewStations(article, stationMappings, locals) {
  const
    { getAllStations } = __,
    {
      sectionFront,
      stationSlug,
      stationSyndication
    } = article,
    syndicated = stationSyndication.map(({ stationSlug }) => stationSlug),
    stationEntries = Object.entries(stationMappings),
    stationsBySlug = await getAllStations.bySlug({ locals }),
    newStations = sectionFront
      ? stationEntries.filter(([key]) => key !== stationSlug && !syndicated.includes(key))
      : stationEntries;

  return newStations.map(([stationSlug, data]) => {
    const { callsign, name } = stationsBySlug[stationSlug];

    return {
      ...data,
      callsign,
      stationName: name,
      stationSlug
    };
  });
}

/**
 *
 * @param {object} apMeta
 * @param {object} articleData
 * @param {object} articleData.article
 * @param {object} articleData.metaTitle
 * @param {object} articleData.metaDescription
 * @returns {object}
 */
async function mapApDataToArticle(apMeta, articleData) {
  const
    { dbGet } = __,
    { article , metaTitle, metaDescription } = articleData,
    { altids, ednote, headline, headline_extended, version } = apMeta,
    [sideShare, tags] = [
      await dbGet(article.sideShare._ref),
      await dbGet(article.tags._ref)
    ],
    tagSlugs = tags.items.map(({ slug }) => slug),
    newTags = _get(apMeta, 'subject', [])
      .map(({ name }) => ({ text: name, slug: slugifyService(name) })),
    newArticleData = {
      article: {
        ...article,
        ap: {
          itemid: altids.itemid,
          etag: altids.etag,
          version,
          ednote
        },
        headline,
        msnTitle: headline,
        pageDescription: headline_extended,
        pageTitle: headline,
        plainTextPrimaryHeadline: headline,
        plainTextShortHeadline: headline,
        primaryHeadline: headline,
        seoDescription: headline_extended,
        seoHeadline: headline,
        shortHeadline: headline,
        sideShare: {
          _ref: article.sideShare._ref,
          ...sideShare,
          title: headline,
          shortTitle: headline
        },
        slug: slugifyService(headline),
        tags: {
          items: [
            ...tagSlugs.includes('ap-news') ? [] : [{ text: 'AP News', slug: 'ap-news' }],
            ...tags.items,
            ...newTags.filter(({ slug }) => !tagSlugs.includes(slug))
          ]
        }
      },
      metaDescription: {
        ...metaDescription,
        description: headline_extended
      },
      metaTitle: {
        ...metaTitle,
        kilnTitle: headline,
        ogTitle: headline,
        title: headline,
        twitterTitle: headline
      }
    };

  return newArticleData;
}

/**
 * Handles the logic needed to import or update an artice from the AP media api
 * @param {object} apMeta - The data returned from AP Media for a single article (the item property)
 * @param {object} stationMappings - The station mappings that go with this AP Media article
 * @param {object} locals
 * @returns {Promise<void>}
 */
async function importArticle(apMeta, stationMappings, locals) {
  const isApContentPublishable = checkApPublishable(apMeta),
    preExistingArticle = await findExistingArticle(apMeta.altids);

  if (!isApContentPublishable && preExistingArticle) {
    // TODO: unpublish
    return { isApContentPublishable, preExistingArticle };
  }

  const
    articleData = await getArticleData(preExistingArticle || await createNewArticle(stationMappings, locals)),
    isModifiedByAP = apMeta.altids.etag !== _get(articleData, 'article.ap.etag'),
    newStations = await getNewStations(articleData.article, stationMappings),
    {
      article,
      metaDescription,
      metaTitle
    } = isModifiedByAP
      ? await mapApDataToArticle(apMeta, articleData)
      : articleData;

  return {
    article,
    isApContentPublishable,
    isModifiedByAP,
    metaDescription,
    metaTitle,
    newStations,
    preExistingArticle
  };
}

module.exports = {
  _internals: __,
  importArticle
};
