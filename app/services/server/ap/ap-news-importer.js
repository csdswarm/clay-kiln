'use strict';
const
  _get = require('lodash/get'),
  _memoize = require('lodash/memoize'),
  _set = require('lodash/set'),
  cheerio = require('cheerio'),
  logger = require('../../universal/log'),
  slugifyService = require('../../universal/slugify'),
  { addLazyLoadProperty } = require('../../universal/utils'),
  { assignDimensionsAndFileSize } = require('../../universal/image-utils'),
  { del: dbDel, get: dbGet, post: dbPost, put: dbPut, raw: dbRaw } = require('../db'),
  { getAllStations } = require('../station-utils'),
  { getApArticleBody, saveApPicture } = require('./ap-media'),
  { put: restPut } = require('../../universal/rest'),
  { searchByQuery } = require('../query'),
  { DEFAULT_STATION } = require('../../universal/constants'),

  log = logger.setup({ file: __filename }),
  PROTOCOL = _get(process, 'env.CLAY_SITE_PROTOCOL', 'https'),
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
    log,
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
    const [existing] = await searchByQuery(query, null, { includeIdInResult: true, shouldDedupeContent: false }),
      { rows: [info] = [] } = existing && await dbRaw(`
          SELECT id, data
          FROM pages,
               jsonb_array_elements_text(data -> \'main\') article_id
          WHERE article_id = ?`,
      existing._id) || {},
      { data, id } = info || {};

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
    `${locals.site.host}/_pages/`,
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
      stationSlug,
      source: 'ap feed'
    };
  });
}

/**
 * If AP provides associations with a picture, this gets the first image and saves it and returns the new URI of
 * the image that is saved to AWS. Otherwise, default image information is returned.
 *
 * @param {{ type: string, uri: string }[]} associations
 * @returns {Promise<{ headline: string, url: string }>}
 */
function resolveImage(associations = []) {
  const
    { saveApPicture } = __,
    apRef = Object.values(associations).find(({ type }) => type === 'picture');

  return apRef
    ?  saveApPicture(apRef.uri)
    : Promise.resolve({
      headline: 'RADIO.COM - Associated Press',
      url: 'https://images.radio.com/aiu-media/og_775x515_0.jpg'
    });
}

/**
 * Gets all subcomponents of the article so that they can be updated appropriately
 * @param {{ feedImg: {_ref: string}, lead: string[], sideShare: {_ref: string}, tags: { _ref: string } }} article
 * @returns {Promise<object | object[]>[]}
 */
function resolveArticleSubComponents(article) {
  const
    { dbGet } = __,
    {
      feedImg,
      lead,
      sideShare,
      tags
    } = article;
  
  return Promise.all([
    dbGet(feedImg._ref),
    Promise.all(lead.map(dbGet)),
    dbGet(sideShare._ref),
    dbGet(tags._ref)
  ]);

}

/**
 * Given existing article data and ap meta data, maps any updated values to the article data and returns the
 * new article data.
 * (NOTE: does not map external items at this time)
 * @param {object} apMeta
 * @param {object} lead
 * @param {object} image
 * @param {object} articleData
 * @param {object[]} newStations
 * @returns {object}
 */
function mapMainArticleData({ apMeta, lead, image, articleData, newStations }) {
  const
    { url: imageUrl } = image,
    { article, metaDescription, metaImage, metaTitle } = articleData,
    { altids, ednote, headline, headline_extended, version } = apMeta,
    { etag, itemid } = altids;

  let { stationSlug, sectionFront, secondarySectionFront, stationSyndication } = article;

  if (stationSlug) {
    stationSyndication = (stationSyndication || []).concat(newStations);
  } else {
    [{ stationSlug, sectionFront, secondarySectionFront } = {}, ...stationSyndication] = newStations || [];
  }

  return {
    article: {
      ...article,
      ap: {
        itemid,
        etag,
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
      feedImgUrl: imageUrl,
      headline,
      lead,
      msnTitle: headline,
      pageDescription: headline_extended,
      pageTitle: headline,
      plainTextPrimaryHeadline: headline,
      plainTextShortHeadline: headline,
      primaryHeadline: headline,
      secondarySectionFront,
      sectionFront,
      seoDescription: headline_extended,
      seoHeadline: headline,
      shortHeadline: headline,
      slug: slugifyService(headline),
      stationSlug,
      stationSyndication
    },
    metaDescription: {
      ...metaDescription,
      description: headline_extended
    },
    metaImage: {
      ...metaImage,
      imageUrl
    },
    metaTitle: {
      ...metaTitle,
      kilnTitle: headline,
      ogTitle: headline,
      title: headline,
      twitterTitle: headline
    }
  };
}

/**
 * Maps data or changes from apMeta to the new or related unity article
 * @param {object} apMeta
 * @param {object} articleData
 * @param {object} articleData.article
 * @param {object} articleData.metaTitle
 * @param {object} articleData.metaDescription
 * @param {object[]} newStations
 * @param {object} locals
 * @returns {object}
 */
async function mapApDataToArticle(apMeta, articleData, newStations, locals) {
  const
    { altids, associations, headline, renditions } = apMeta,
    { pageData, article } = articleData,
    { assignDimensionsAndFileSize, dbDel, getApArticleBody, restPut } = __,
    { itemid } = altids,

    [
      image,
      [
        feedImg,
        lead,
        sideShare,
        tags
      ]
    ] = [
      await resolveImage(associations),
      await resolveArticleSubComponents(article)
    ],
  
    // updateTags
    tagSlugs = tags.items.map(({ slug }) => slug),
    newTags = _get(apMeta, 'subject', [])
      .filter(({ creator }) => creator === 'Machine')
      .map(({ name }) => ({ text: name, slug: slugifyService(name) })),

    // setMainArticleData
    newArticleData = mapMainArticleData({ apMeta, lead, image, articleData, newStations }),
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
  
  // set subArticleData
  await assignDimensionsAndFileSize(image.url, newFeedImage);
  
  const { _ref, ...props } = newFeedImage,
    imgRef = _ref.replace(/feed\-image/, 'image');

  if (!lead.length) {
    lead.push({ _ref: imgRef, ...props });
  } else {
    const existing = lead.find(({ _ref }) => _ref.includes('_components/image')) || {};

    Object.assign(existing, { _ref: imgRef, ...existing, ...props });
  }

  // mapContentToArticle
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

  // saveArticle
  const { _ref: articleRef, ...newArticleInfo } = newArticleData.article;

  await restPut(`${PROTOCOL}://${articleRef}`, newArticleInfo, true);

  // publishArticle
  const { _ref: pageRef = '', ...pageInfo } = pageData;

  await restPut(`${PROTOCOL}://${pageRef.replace(/@published/, '')}@published`, pageInfo, true);

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

  if ( !stationMappings || stationMappings === {}) {
    return { message: 'no subscribers' };
  }

  if (!isApContentPublishable && preExistingArticle) {
    // TODO: unpublish
    return { isApContentPublishable, preExistingArticle };
  }

  const
    articleData = await getArticleData(preExistingArticle || await createNewArticle(stationMappings, locals)),
    newStations = await getNewStations(articleData.article, stationMappings),
    isModifiedByAP = apMeta.altids.etag !== _get(articleData, 'article.ap.etag'),
    {
      article,
      metaDescription,
      metaImage,
      metaTitle
    } = isModifiedByAP || newStations
      ? await mapApDataToArticle(apMeta, articleData, newStations, locals)
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
