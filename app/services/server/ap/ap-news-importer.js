'use strict';
const
  _get = require('lodash/get'),
  _memoize = require('lodash/memoize'),
  _set = require('lodash/set'),
  cheerio = require('cheerio'),
  slugifyService = require('../../universal/slugify'),
  { addLazyLoadProperty } = require('../../universal/utils'),
  { assignDimensionsAndFileSize } = require('../../universal/image-utils'),
  { del: dbDel, get: dbGet, post: dbPost, put: dbPut, raw: dbRaw } = require('../db'),
  { getAllStations } = require('../station-utils'),
  { getApArticleBody, saveApPicture } = require('./ap-media'),
  { put: restPut } = require('../../universal/rest'),
  { searchByQuery } = require('../query'),
  { DEFAULT_STATION } = require('../../universal/constants'),

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
    dbDel,
    dbGet,
    dbPost,
    dbPut,
    dbRaw,
    getAllStations,
    getApArticleBody,
    restPut,
    saveApPicture,
    searchByQuery
  },

  getComponentBase = _memoize((name, { site: { host } }) => __.dbGet(`${host}/_components/${name}`)),
  getNewComponent = (name, locals) => ({ ... getComponentBase(name, locals) });

// createPage imports hierarchy makes an immediate call to redis, which causes issues in tests, so lazy load only.
addLazyLoadProperty(__, 'createPage', () => require('../page-utils').createPage);

/**
 * Checks to see if the AP Content is publishable
 * @param {string[]} editorialtypes
 * @param {string[]} signals
 * @param {string} pubstatus
 * @returns {boolean}
 */
function checkApPublishable({ editorialtypes = '', pubstatus, signals = '' }) {
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
      { rows: [info] = [] } = existing && await dbRaw(`
          SELECT id, data
          FROM pages,
               jsonb_array_elements_text(data -> \'main\') article_id
          WHERE article_id = ?`,
      existing._id) || {},
      { id, data } = info || {};

    if (id) {
      return { _ref: id, ...data };
    }

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
 * @returns {Promise<object>}
 */
async function getArticleData(pageData) {
  const
    { dbGet } = __,
    { head, main } = pageData,
    articleRef = main.find(text => text.includes('_components/article')),
    [
      article,
      [metaDescription, metaImage, metaTags, metaTitle]
    ] = [
      { _ref: articleRef, ...await dbGet(articleRef) },
      await Promise.all(head
        .filter(text => ['description', 'image', 'tags', 'title'].some(name => text.includes('meta-' + name)))
        .sort()
        .map(_ref => ({ _ref, ...dbGet(_ref) })))
    ];

  return {
    article,
    metaDescription,
    metaImage,
    metaTags,
    metaTitle,
    pageData
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

    const { callsign, name } = stationSlug === DEFAULT_STATION.site_slug
      ? DEFAULT_STATION
      : stationsBySlug[stationSlug];

    return {
      ...data,
      callsign,
      stationName: name,
      stationSlug
    };
  });
}

/**
 * Maps data or changes from apMeta to the new or related unity article
 * @param {object} apMeta
 * @param {object} articleData
 * @param {object} articleData.article
 * @param {object} articleData.metaTitle
 * @param {object} articleData.metaDescription
 * @param {object} locals
 * @returns {object}
 */
async function mapApDataToArticle(apMeta, articleData, locals) {
  const
    { altids, associations, ednote, headline, headline_extended, renditions, version } = apMeta,
    { pageData, article, metaDescription, metaImage, metaTitle } = articleData,
    { assignDimensionsAndFileSize, dbDel, dbGet, getApArticleBody, restPut, saveApPicture } = __,
    { itemid } = altids,

    image = associations
      ? await saveApPicture((Object.values(associations).find(({ type }) => type === 'picture') || {}).uri)
      : { headline: 'placeholder', url: 'https://images.radio.com/aiu-media/og_775x515_0.jpg' },
    [feedImg, lead, sideShare, tags] = [
      await dbGet(article.feedImg._ref),
      await Promise.all(article.lead.map(dbGet)),
      await dbGet(article.sideShare._ref),
      await dbGet(article.tags._ref)
    ],
    tagSlugs = tags.items.map(({ slug }) => slug),
    newTags = _get(apMeta, 'subject', [])
      .filter(({ creator }) => creator === 'Machine')
      .map(({ name }) => ({ text: name, slug: slugifyService(name) })),
    newArticleData = {
      article: {
        ...article,
        ap: {
          itemid,
          etag: altids.etag,
          version,
          ednote
        },
        byline: [
          {
            names: [],
            prefix: 'by',
            sources: [
              { text: 'The Associated Press', slug: 'the-associated-press' }
            ]
          }
        ],
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
        slug: slugifyService(headline)
      },
      metaDescription: {
        ...metaDescription,
        description: headline_extended
      },
      metaImage: {
        ...metaImage,
        imageUrl: image.url
      },
      metaTitle: {
        ...metaTitle,
        kilnTitle: headline,
        ogTitle: headline,
        title: headline,
        twitterTitle: headline
      }
    },
    newFeedImage = {
      _ref: article.feedImg._ref,
      ...feedImg,
      url: image.url,
      alt: image.headline
    },
    newSideShare = {
      _ref: article.sideShare._ref,
      ...sideShare,
      pinImage: image.url,
      shortTitle: headline,
      title: headline
    },
    newArticleTags = {
      _ref: article.tags._ref,
      items: [
        ...tagSlugs.includes('ap-news') ? [] : [{ text: 'AP News', slug: 'ap-news' }],
        ...tags.items,
        ...newTags.filter(({ slug }) => !tagSlugs.includes(slug))
      ]
    };

  await assignDimensionsAndFileSize(image.url, newFeedImage);

  const { _ref, ...props } = newFeedImage,
    imgRef = _ref.replace(/feed\-image/, 'image');

  if (!lead.length) {
    lead.push({ _ref: imgRef, ...props });
  } else {
    const existing = lead.find(({ _ref }) => _ref.includes('_components/image')) || {};

    Object.assign(existing, { _ref: imgRef, ...existing, ...props });
  }

  const
    TYPES = {
      bq: 'blockquote',
      dl: 'html-embed',
      fn: 'paragraph',
      hl2: 'subheader',
      hr: 'divider',
      media: 'html-embed',
      note: 'paragraph',
      ol: 'paragraph',
      p: 'paragraph',
      pre: 'html-embed',
      table: 'html-embed',
      ul: 'paragraph'
    },
    INNER_TEXT_TYPES = 'bq fn hl2 note p media'.split(/ /g),
    OUTER_TEXT_TYPES = 'dl pre table'.split(/ /g),
    LIST_TYPES = 'ol ul'.split(/ /g),
    doc = renditions && cheerio.load(await getApArticleBody(renditions.nitf.href)),
    newArticleContent = doc && await Promise.all(doc('block').children()
      .filter(Object.keys(TYPES).join(','))
      .map(async (index, el) => {
        const
          instanceId = `${itemid}-${index + 1}`,
          name = el.tagName.toLowerCase(),
          componentName = TYPES[name] || 'html-embed',
          data = await getNewComponent(componentName, locals);

        data._ref = `${locals.site.host}/_components/${componentName}/instances/ap-${instanceId}`;

        if (INNER_TEXT_TYPES.includes(name)) {
          data.text = doc(el).html();
        } else if (OUTER_TEXT_TYPES.includes(name)) {
          data.text = doc.html(el);
        } else if (LIST_TYPES.includes(name)) {
          data.text = doc(el).find('> li')
            .map((idx, item) => `${el.tagName.toLowerCase() === 'ol' ? idx + 1 + '.' : '•'} ${doc(item).html()}`)
            .get()
            .join('<br>\n');
        }

        return data;
      }).get());

  article.content.map(({ _ref }) => _ref).forEach(dbDel);

  // compose whole
  Object.assign(newArticleData.article, {
    content: newArticleContent || [],
    feedImg: newFeedImage,
    sideShare: newSideShare,
    tags: newArticleTags
  });

  const { _ref: articleRef, ...newArticleInfo } = newArticleData.article;

  await restPut(`${process.env.CLAY_SITE_PROTOCOL}://${articleRef}`, newArticleInfo, true);

  const { _ref: pageRef = '', ...pageInfo } = pageData;

  await restPut(`${process.env.CLAY_SITE_PROTOCOL}://${pageRef.replace(/@published/, '')}@published`, pageInfo, true);

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
      ? await mapApDataToArticle(apMeta, articleData, locals)
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
