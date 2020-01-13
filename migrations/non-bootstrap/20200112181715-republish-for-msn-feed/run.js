'use strict';

const republishPageUris = require('../utils/republish-page-uris').v1,
  utils = require('../../utils/migration-utils'),
  { v1: parseHost } = require('../../utils/parse-host'),
  getPageUris = require('../../utils/get-page-uris').v1,
  getNewComponentsYml = require('../../legacy/20191117120253-msn-feed/get-new-components-yml.js'),
  {
    _isEqual: areDeeplyEqual,
    yamljs
  } = utils.v1,
  { esQuery } = utils.v2,
  matchesMsnFeed = {
    match: {
      "feeds.msn": true
    }
  };

run().catch(console.error)

async function run () {
  const host = process.argv[2] || 'clay.radio.com',
    envInfo = parseHost(host),
    newComponentsYml = getNewComponentsYml(host, envInfo.http),
    newComponentsJson = yamljs.parse(newComponentsYml),
    { query } = newComponentsJson._components.feeds.instances['msn']

  removeMsnMatch(query)

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
 * existing content doesn't have the feeds.msn property yet so we need to remove
 *   it in order to fetch the published content.
 *
 * @param {object} query - this parameter is mutated
 */
function removeMsnMatch(query) {
  query.query.bool.filter = query.query.bool.filter.filter(
    aFilter => !areDeeplyEqual(aFilter, matchesMsnFeed)
  )
}
