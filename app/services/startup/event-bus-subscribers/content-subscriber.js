'use strict';

const
  _differenceWith = require('lodash/differenceWith'),
  _get = require('lodash/get'),
  ANF_API = '/apple-news/articles',
  buffer = require('../../../services/server/buffer'),
  db = require('../../../services/server/db'),
  log = require('../../../services/universal/log').setup({ file: __filename }),
  { getComponentName } = require('clayutils'),
  { subscribe } = require('amphora-search'),
  uri = require('../../server/uri'),

  __ = {
    dbGet: db.get,
    dbPut: db.put,
    getCanonicalRedirect: uri.getCanonicalRedirect,
    getComponentName,
    getUri: uri.getUri,
    handlePublishStationSyndication,
    setUri: uri.setUri,
    getByUrl: uri.getByUrl
  };

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
    ['article', 'gallery'].includes(__.getComponentName(page.data.main[0]));
}

/**
 * Upon publish, publish to apple news feed and
 * add id and revision to db
 *
 * @param {page} page - publish page event payload
 **/
async function handlePublishContentPg(page) {
  __.handlePublishStationSyndication(page);

  if (process.env.APPLE_NEWS_ENABLED === 'true') {
    const articleRef = page.data.main[0].replace('@published', ''),
      appleNewsKey = `${ process.env.CLAY_SITE_HOST }/_apple_news/${ articleRef }`,
      appleNewsData = await __.dbGet(appleNewsKey, null, {});

    try {
      // eslint-disable-next-line one-var
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
          await __.dbPut(appleNewsKey, updatedAppleNewsData);
        } else {
          await db.post(appleNewsKey, updatedAppleNewsData);
        }
      }
    } catch (e) {
      log('error', `APPLE NEWS LOG -- Error hitting apple news api on pub: ${ e.message } ${ e.stack }`);
      if (e.message === '404: Not Found') {
        await db.del(appleNewsKey);
      }
    }
  }
}

/**
 * Upon unpublish, remove from apple news feed
 * and remove id and revision from db
 *
 * @param {Object} page - unpublish page event payload
 */
async function handleUnpublishContentPg(page) {
  try {
    const pageData = await __.dbGet(page.uri),
      mainRef = pageData.main[0];

    updateSyndicationRedirects(page);

    if (['article', 'gallery'].includes(__.getComponentName(mainRef)) &&
      process.env.APPLE_NEWS_ENABLED === 'true') {
      const appleNewsKey = `${ process.env.CLAY_SITE_HOST }/_apple_news/${ mainRef }`,
        articleData = await __.dbGet(appleNewsKey, null, {}),
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
    log('error', `APPLE NEWS LOG -- Error hitting apple news api on unpub: ${ e.message } ${ e.stack }`);
  }
}

async function updateSyndicationRedirects(page) {
  const pageData = await __.dbGet(page.uri),
    mainRef = pageData.main[0],
    host = page.uri.split('/')[0],
    [contentData, hostData] = await Promise.all([
      __.dbGet(mainRef),
      __.getByUrl(`${host}/`)
    ]),
    hostId = _get(hostData, '0.id');

  for (const syndication of contentData.stationSyndication) {
    const stationFrontId = await _get(await __.getByUrl(`${host}/${syndication.stationSlug}`), '0.id');

    if (stationFrontId) {
      await __.setUri(stationFrontId, `${host}${syndication.syndicatedArticleSlug}`);
    } else {
      await __.setUri(hostId, `${host}${syndication.syndicatedArticleSlug}`);
    };
  }
}

/**
 * Creates URIs for station syndications.
 * @param {object} page
 * @returns {Promise<void>}
 */
async function handlePublishStationSyndication(page) {
  const mainRef = page.data.main[0],
    host = page.uri.split('/')[0];

  if (['article', 'gallery'].includes(__.getComponentName(mainRef))) {
    const contentData = await __.dbGet(mainRef),
      canonicalInstance = new URL(contentData.canonicalUrl),
      allSyndicatedUrls = await __.getUri(page.uri.replace('@published', '')),
      originalArticleId = await __.getCanonicalRedirect(`${canonicalInstance.host}${canonicalInstance.pathname}`),
      redirectUri = _get(originalArticleId, '0.id'),
      newSyndicatedUrls = (contentData.stationSyndication || []).filter(station => !_get(station, 'unsubscribed', false)),
      outDatedUrls = _differenceWith(allSyndicatedUrls, newSyndicatedUrls, (prev, next) => prev.url === `${host}${next.syndicatedArticleSlug}`),
      removeCanonical = outDatedUrls.filter(({ url }) => !contentData.canonicalUrl.includes(url)),
      queue = (newSyndicatedUrls || []).map(station => {
        if (station.syndicatedArticleSlug) {
          const url = `${host}${station.syndicatedArticleSlug}`,
            redirect = page.uri.replace('@published', '');

          return __.dbPut(`${host}/_uris/${buffer.encode(url)}`, redirect);
        }
      }),
      updateDeprecatedUrls = removeCanonical.map(({ url }) => {
        return __.setUri(redirectUri, url);
      });

    await Promise.all(queue);
    await Promise.all(updateDeprecatedUrls);
  }
}

/**
 * subscribe to event bus messages
 */
function subscribeToBusMessages() {
  subscribe('publishPage').through(publishPage);
  subscribe('unpublishPage').through(unpublishPage);
}
subscribeToBusMessages._internals = __;

module.exports = subscribeToBusMessages;
