'use strict';

const db = require('../server/db'),
  domUtils = require('../server/dom-utils'),
  noItems = { items: [] };

/**
 * returns the script sources that aren't in the list of valid sources
 *
 * @param {string} text
 * @param {object} locals
 *
 * @return {Promise<boolean>}
 */
module.exports = async (text, locals) => {
  const parser = new domUtils.DOMParser(),
    doc = parser.parseFromString(text, 'text/html'),
    sources = Array.from(doc.getElementsByTagName('script')).map(el =>
      el.getAttribute('src')
    ),
    // query the DB
    validSources = (await db.get(`${process.env.CLAY_SITE_HOST}/_valid_source/items`, locals, noItems)).items,
    isUntrusted = src => {
      // We allow scripts without a `src` attribute because we assume
      // it is an inline script
      const hasSrcAttr = !!src;

      return hasSrcAttr &&
        !validSources.some(validSrc => src.includes(validSrc));
    };

  return sources.filter(isUntrusted);
};
