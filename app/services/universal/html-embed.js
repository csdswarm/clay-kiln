'use strict';

const db = require('../../services/server/db');

/**
 * determine if there are any script src tags that are not valid
 *
 * @param {string} text
 *
 * @return {Promise<boolean>}
 */
async function hasBadSource(text) {
  // pull out script tags
  // our version of node does not support string.prototype.matchAll, so doing it with multiple steps
  const scripts = text.match(/<script[^>]+src=(["|'])(.*?)\1/gi) || [],
    sources = scripts.map(item => item.match(/src=(["|'])(.*?)\1/i)[2]),
    // query the DB
    validSources = (await db.get(`${process.env.CLAY_SITE_HOST}/_valid_scripts/items`)).items,
    // check each source and verify it is valid
    badSources = sources.map(source => {
      for (const validSource of validSources) {
        if (source.includes(validSource)) {
          return false;
        }
      }

      return true;
    });

  return badSources.includes(true);
}

module.exports = {
  hasBadSource
};
