'use strict';

const h = require('highland'),
  db = require('../../../services/server/db'),
  log = require('../../../services/universal/log').setup({ file: __filename }),
  { getComponentName } = require('clayutils'),
  { subscribe, elastic, helpers } = require('amphora-search'),
  ANF_API = '/apple-news/articles',
  INDEX = helpers.indexWithPrefix('published-content', process.env.ELASTIC_PREFIX);

/**
 * @param {Object} stream - save page event payload
 */
function save(stream) {
  stream
    .filter( filterNonContentComponent )
    .each( handleSaveContent );
}

/**
 * @param {Object} stream - publish page event payload
 */
function publishPage(stream) {
  stream
    .filter( filterNonContentType )
    .each( handlePublishContentPg );
}

/**
 * @param {Object} stream - unpublish page event payload
 */
function unpublishPage(stream) {
  stream
    .each( handleUnpublishContentPg );
}

/**
 * @param {Object} page - publish page event payload
 * @returns {boolean}
 */
function filterNonContentType(page) {
  return page.data && page.data.main &&
    ['article', 'gallery'].includes(getComponentName(page.data.main[0]));
}

/**
 * @param {Object} stream - save component event payload
 * @returns {boolean}
 */
function filterNonContentComponent(stream) {
  return stream._incoming && stream._incoming[0] &&
    ['article', 'gallery'].includes(getComponentName(stream._incoming[0].key));
}

async function handleSaveContent(stream) {
  const componentSaveEvent = stream._incoming[0],
    { appleNewsID,
      appleNewsRevision } = JSON.parse(componentSaveEvent.value);

  const { appleNewsID: appleID, appleNewsRevision: appleRev } = await db.get(componentSaveEvent.key);
  
  console.log('op key', componentSaveEvent.key);
  console.log('get from db:', appleID, appleRev);
  console.log('save', appleNewsID, appleNewsRevision);
}

/**
 * Upon publish, publish to apple news feed and
 * add appleNewsID and appleNewsRevision to article
 *
 * @param {page} page - publish page event payload
 **/
async function handlePublishContentPg(page) {
  try {
    const host = page.uri.split('/')[0],
      articleRef = page.data.main[0],
      unpubArticleRef = articleRef.replace('@published', ''),
      publishedArticleData = await db.get(articleRef),
      unpubArticleData = await db.get(unpubArticleRef);

    console.log('handle pub page', publishedArticleData.appleNewsEnabled);
    if (publishedArticleData.appleNewsEnabled) {
      try {
        console.log('sending to apple news -- ', unpubArticleData.appleNewsID ? 'update' : 'publish', 'unpub:', unpubArticleData.appleNewsID, unpubArticleData.appleNewsRevision, 'pub:', publishedArticleData.appleNewsID, publishedArticleData.appleNewsRevision);
        const { appleNewsRevision, appleNewsID } = publishedArticleData,
          response = await fetch(
            `${ process.env.CLAY_SITE_PROTOCOL }://${ host }${
              ANF_API }${ appleNewsID ? `/${ appleNewsID }` : '' }`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleRef,
                revision: appleNewsRevision
              })
            }
          ),
          jsonOrText = (response.headers.get('Content-Type') || '').includes
          ('application/json') ? await response.json() : await response.text(),
          { id, revision } = jsonOrText;

        if (id && revision) {
          publishedArticleData.appleNewsID = id;
          publishedArticleData.appleNewsRevision = revision;
          console.log('apple news returned id & revision', id, revision);
          // await db.put(unpubArticleRef, JSON.stringify(publishedArticleData));
          // await db.put(articleRef, JSON.stringify(publishedArticleData));
          // console.log('finish saving id & revision to db');
          // const { appleNewsID, appleNewsRevision } = await db.get(unpubArticleRef);
          // console.log(appleNewsID, appleNewsRevision);
          // const { appleNewsID: pubID, appleNewsRevision: pubRev } = await db.get(articleRef);
          // console.log(pubID, pubRev);
          await elastic.update(INDEX, unpubArticleRef, publishedArticleData, false, true);
          const elasticData = await elastic.getDocument(INDEX, unpubArticleRef);
          console.log('elastic data', unpubArticleRef, elasticData);
        }
      } catch (e) {
        log('error', `Error hitting apple news api on pub: ${ e.message } ${ e.stack }`);
        if (e.message === '404: Not Found') {
          delete unpubArticleData.appleNewsID;
          delete unpubArticleData.appleNewsRevision;
          console.log('article not found in apple news');
          await db.put(unpubArticleRefarticleRef, JSON.stringify(unpubArticleData));
          await db.put(articleRef, JSON.stringify(unpubArticleData));
          console.log('finish deleting article ID from db');
        }
      }
    }
  } catch (e) {
    log('error', `Error getting article data: ${ e.message } ${ e.stack }`);
  }
};

/**
 * Upon unpublish, remove from apple news feed
 * and remove appleNewsID and appleNewsRevision
 * from article data
 *
 * @param {Object} page - unpublish page event payload
 */
async function handleUnpublishContentPg(page) {
  console.log('handle unpub page');
  try {
    const host = page.uri.split('/')[0],
      pageData = await db.get(page.uri),
      mainRef = pageData.main[0];

    if (['article', 'gallery'].includes(getComponentName(mainRef))) {
      console.log('is article/gallery');
      const articleData = await db.get(mainRef),
        { appleNewsEnabled, appleNewsID } = articleData;

      if (appleNewsEnabled && appleNewsID) {
        const response = await fetch(
          `${ process.env.CLAY_SITE_PROTOCOL }://${ host }${
            ANF_API }/${ appleNewsID }`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if ([204, 404].includes(response.status)) {
          console.log('finish deleting article from apple news');
          delete articleData.appleNewsID;
          delete articleData.appleNewsRevision;
          await db.put(mainRef, JSON.stringify(articleData));
          await db.put(mainRef.replace('@published', ''), JSON.stringify(articleData));
          console.log('finish deleting article ID from db');
        } else {
          console.log('unpub failed');
        }
      }
    }
  } catch (e) {
    log('error', `Error hitting apple news api on unpub: ${ e.message } ${ e.stack }`);
  }
};

/**
 * subscribe to event bus messages
 */
module.exports = () => {
  // subscribe('save').through(save);
  // subscribe('publishPage').through(publishPage);
  // subscribe('unpublishPage').through(unpublishPage);
};
