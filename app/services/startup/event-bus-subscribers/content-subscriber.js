'use strict';

const db = require('../../../services/server/db'),
  log = require('../../../services/universal/log').setup({ file: __filename }),
  { getComponentName } = require('clayutils'),
  { subscribe } = require('amphora-search'),
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
 * Upon publish, publish to apple news feed and
 * add appleNewsID and appleNewsRevision to article
 *
 * @param {page} page - publish page event payload
 **/
async function handlePublishContentPg(page) {
  try {
    const host = page.uri.split('/')[0],
      articleRef = page.data.main[0].replace('@published',''),
      articleData = await db.get(articleRef);

    if (articleData.appleNewsEnabled) {
      try {
        const { appleNewsRevision, appleNewsID } = articleData,
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
          articleData.appleNewsID = id;
          articleData.appleNewsRevision = revision;
          await db.put(articleRef, JSON.stringify(articleData));
        }
      } catch (e) {
        log('error', `Error hitting apple news api on pub: ${ e.message } ${ e.stack }`);
        if (e.message === '404: Not Found') {
          delete articleData.appleNewsID;
          delete articleData.appleNewsRevision;
          await db.put(articleRef, JSON.stringify(articleData));
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
  try {
    const host = page.uri.split('/')[0],
      pageData = await db.get(page.uri),
      mainRef = pageData.main[0];

    if (['article', 'gallery'].includes(getComponentName(mainRef))) {
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
          delete articleData.appleNewsID;
          delete articleData.appleNewsRevision;
          await db.put(mainRef, JSON.stringify(articleData));
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
