'use strict';

const db = require('../../../services/server/db'),
  { subscribe } = require('amphora-search'),
  log = require('../../../services/universal/log').setup({ file: __filename }),
  { getComponentName } = require('clayutils'),
  ANF_API = '/apple-news/articles';

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

/**
 * Upon publish, publish to apple news feed and
 * add appleNewsID and appleNewsRevision to article
 *
 * @param {page} page - publish page event payload
 **/
async function handlePublishContentPg(page) {
  if (process.env.APPLE_NEWS_ENABLED) {
    try {
      let appleNewsData = {};
      const articleRef = page.data.main[0].replace('@published', ''),
        appleNewsKey = `${ process.env.CLAY_SITE_HOST }/_apple_news/${ articleRef }`;

      try {
        appleNewsData = await db.get(appleNewsKey);
      } catch(e) { /* no apple news data in db for article */ };

      const { id, revision } = appleNewsData,
        response = await fetch(
          `${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }${
            ANF_API }${ id ? `/${ id }` : '' }`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articleRef,
              revision: revision || null
            })
          }
        ),
        jsonOrText = (response.headers.get('Content-Type') || '').includes
        ('application/json') ? await response.json() : await response.text(),
        { id: newID, revision: newRevision } = jsonOrText;

      if (newID && newRevision) {
        const updatedAppleNewsData = JSON.stringify({
          id: newID, revision: newRevision
        });

        if (id) {
          await db.put(appleNewsKey, updatedAppleNewsData);
        } else {
          await db.post(appleNewsKey, updatedAppleNewsData);
        }
      }
    } catch (e) {
      log('error', `Error hitting apple news api on pub: ${ e.message } ${ e.stack }`);
      if (e.message === '404: Not Found') {
        await db.del(appleNewsKey);
      }
    }
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
  try {
    const pageData = await db.get(page.uri),
      mainRef = pageData.main[0];

    if (['article', 'gallery'].includes(getComponentName(mainRef)) &&
      process.env.APPLE_NEWS_ENABLED) {
      const appleNewsKey = `${ process.env.CLAY_SITE_HOST }/_apple_news/${ mainRef }`,
        articleData = await db.get(appleNewsKey),
        { id } = articleData;

      if (id) {
        const response = await fetch(
          `${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }${
            ANF_API }/${ id }`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if ([204, 404].includes(response.status)) {
          await db.del(appleNewsKey);
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
  subscribe('publishPage').through(publishPage);
  subscribe('unpublishPage').through(unpublishPage);
};
