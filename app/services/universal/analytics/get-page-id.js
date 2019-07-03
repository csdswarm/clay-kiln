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
  const fromPathname = makeFromPathname({ pathname });

  return fromPathname.getPageId(pageData);
};
