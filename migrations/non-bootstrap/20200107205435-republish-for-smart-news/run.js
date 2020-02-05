'use strict';

const republishPageUris = require('../utils/republish-page-uris').v1,
  utils = require('../../utils/migration-utils'),
  { v1: parseHost } = require('../../utils/parse-host'),
  getPageUris = require('../../utils/get-page-uris').v1,
  getSmartNewsYml = require('../../legacy/20191208230827-smart-news-feed/get-smart-news-yml'),
  {
    _isEqual: areDeeplyEqual,
    yamljs
  } = utils.v1,
  { esQuery } = utils.v2,
  matchesSmartNewsFeed = {
    match: {
      "feeds.smartNews": true
    }
  };

run().catch(console.error)

async function run () {
  const host = process.argv[2] || 'clay.radio.com',
    envInfo = parseHost(host),
    smartNewsYml = getSmartNewsYml(host, envInfo.http),
    smartNewsJson = yamljs.parse(smartNewsYml),
    { query } = smartNewsJson._components.feeds.instances['smart-news']

  removeSmartNewsMatch(query)

  let result;

  try {
    result = await esQuery(
      query,
      {
        ...envInfo.es,
        index: 'published-content',
        logError: true
      }
    );
  } catch (_err) {
    // the error was already logged so we just need to return early
    return;
  }

  const uris = result.hits.hits.map(item => item._id),
    pageUris = await getPageUris.fromContentComponentUris(uris);

  await republishPageUris(pageUris, envInfo);
}

// helper functions

/**
 * existing content doesn't have the feeds.smartNews property yet so we need to
 *   remove it in order to fetch the published content.
 *
 * @param {object} query - this parameter is mutated
 */
function removeSmartNewsMatch(query) {
  query.query.bool.filter = query.query.bool.filter.filter(
    aFilter => !areDeeplyEqual(aFilter, matchesSmartNewsFeed)
  )
}
