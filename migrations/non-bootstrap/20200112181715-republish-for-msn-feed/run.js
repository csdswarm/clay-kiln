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
  },
  hasMsnTitleLength = {
    range: {
      msnTitleLength: { gt: 20 }
    }
  };

run().catch(console.error)

async function run () {
  const host = process.argv[2] || 'clay.radio.com',
    envInfo = parseHost(host),
    newComponentsYml = getNewComponentsYml(host, envInfo.http),
    newComponentsJson = yamljs.parse(newComponentsYml),
    { query } = newComponentsJson._components.feeds.instances['msn'];

  removeMsnSpecificFilters(query);

  // bump the size from 25 to 50 because we removed the msnTitle length filter
  //   which means the top 25 aren't guaranteed to have a headline of at least
  //   20 characters.  This is a small convenience hack because most headlines
  //   will be at least 20 characters, and the way around this hack would be to
  //   add another index to elasticsearch which would be silly to implement just
  //   for this migration.
  query.size = 50;

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
 * existing content doesn't have the feeds.msn nor msnTitleLength properties yet
 *   so we need to remove them in order to fetch the published content.
 *
 * @param {object} query - this parameter is mutated
 */
function removeMsnSpecificFilters(query) {
  query.query.bool.filter = query.query.bool.filter.filter(
    aFilter => !areDeeplyEqual(aFilter, matchesMsnFeed)
      && !areDeeplyEqual(aFilter, hasMsnTitleLength)
  )
}
