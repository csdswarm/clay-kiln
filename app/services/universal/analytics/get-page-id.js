'use strict';

const makeFromPathname = require('./make-from-pathname');

/**
 * Gets the page id (pid).
 *
 * This needed to be in its own file so it could be used both by
 *   './get-tracking-data' as well as 'meta-tags/model' to override the bogus
 *   imported NMC pid.
 *
 * @param {object} arg
 * @param {string} arg.pageData - the result of './get-page-data.js'
 * @param {object} arg.pathname
 * @returns {string}
 */
module.exports = ({ pageData, pathname }) => {
  const fromPathname = makeFromPathname({ pathname }),
    pageId = fromPathname.getPageId(pageData);

  // added this character limit here because it's needed both for nmc tags and
  // google ads targeting data
  return pageId.substring(0, 40);
};
