'use strict';
const
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  logger = require('../../universal/log'),
  slugifyService = require('../../universal/slugify'),
  { addLazyLoadProperty } = require('../../universal/utils'),
  { assignDimensionsAndFileSize } = require('../../universal/image-utils'),
  { get: dbGet, put: dbPut, raw: dbRaw } = require('../db'),
  { getAllStations } = require('../station-utils'),
  { inspect } = require('util'),
  { saveApPicture } = { saveApPicture: () => {} }, // require('./ap-media'),
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
    assignDimensionsAndFileSize,
    dbGet,
    dbPut,
    dbRaw,
    getAllStations,
    inspect,
    log,
    saveApPicture,
    searchByQuery
  };

// createPage imports hierarchy makes an immediate call to redis, which causes issues in tests, so lazy load only.
addLazyLoadProperty(__, 'createPage', require('../page-utils').createPage);

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
      { rows: [data] = [] } = existing && await dbRaw(`
        SELECT data 
        FROM pages, jsonb_array_elements_text(data->\'main\') article_id
        WHERE article_id = ?`,
      existing._id) || {};

    return data;

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
    [
      article,
      [ metaDescription, metaImage, metaTags, metaTitle ]
    ] = [
      await dbGet(main.find(text => text.includes('_components/article'))),
      await Promise.all(head
        .filter(text => ['description', 'image', 'tags', 'title'].some(name => text.includes('meta-' + name)))
        .sort()
        .map(dbGet))
    ];

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
    { altids, associations, ednote, headline, headline_extended, version } = apMeta,
    { article, metaDescription, metaImage, metaTitle } = articleData,
    { assignDimensionsAndFileSize, dbGet, inspect, log, saveApPicture } = __;
  
  if ( !associations ) {
    log(
      'error',
      'missing image data',
      new Error(`cannot find associations${inspect({ apMeta }, { depth: 20 })}`)
    );
    return {};
  }
  
  const
    apImageInfo = Object.values(associations).find(({ type }) => type === 'picture'),
    [feedImg, image, lead, sideShare, tags] = [
      await dbGet(article.feedImg._ref),
      await saveApPicture(apImageInfo.uri),
      await Promise.all(article.lead.map(dbGet)),
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
        feedImg: {
          ...feedImg,
          url: image.url,
          alt: image.headline
        },
        feedImgUrl: image.url,
        headline,
        lead,
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
          pinImage: image.url,
          shortTitle: headline,
          title: headline
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
      },
      metaImage: {
        ...metaImage,
        imageUrl: image.url
      }
    },
  
    newFeedImage = _get(newArticleData, 'article.feedImg', {});

  await assignDimensionsAndFileSize(image.url, newFeedImage);

  const { _ref, ...props } = newFeedImage,
    imgRef = _ref.replace(/feed\-image/, 'image');

  if (!lead.length) {
    lead.push({ _ref: imgRef, ...props });
  } else {
    const existing = lead.find(({ _ref }) => _ref.includes('_components/image')) || {};

    Object.assign(existing, { _ref: imgRef, ...existing, ...props });
  }

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
      metaImage,
      metaTitle
    } = isModifiedByAP
      ? await mapApDataToArticle(apMeta, articleData)
      : articleData;

  return {
    article,
    isApContentPublishable,
    isModifiedByAP,
    metaDescription,
    metaImage,
    metaTitle,
    newStations,
    preExistingArticle
  };
}

module.exports = {
  _internals: __,
  importArticle
};
