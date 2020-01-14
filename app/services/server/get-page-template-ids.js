'use strict';

const _flatten = require('lodash/flatten'),
  db = require('amphora-storage-postgres'),
  { CLAY_SITE_HOST } = process.env;

/**
 * fetches the page template ids from the database
 *
 * @returns {Promise<Set<string>>}
 */
async function getPageTemplateIdsFromDb() {
  const { rows } = await db.raw(`
      select data
      from lists
      where id = '${CLAY_SITE_HOST}/_lists/new-pages'
    `),
    pageTemplateIds = _flatten(
      rows[0].data._value
        .map(item => item.children.map(child => child.id))
    );

  return new Set(pageTemplateIds);
}

/**
 * returns all page ids inside new-pages.  It's weird, but this is actually the
 *   condition kiln uses to tell whether a page is a template when it notifies
 *   the editor.
 *
 * note: I think the performance gain of caching this longer than the life of
 *   the request does not outweigh the complexity of keeping that cache up to
 *   date.  If performance becomes a concern we can revisit this decision.
 *
 * @param {object} locals
 * @returns {Promise<Set<string>>}
 */
module.exports = async locals => {
  if (!locals) {
    return getPageTemplateIdsFromDb();
  }

  if (!locals.pageTemplateIds) {
    locals.pageTemplateIds = await getPageTemplateIdsFromDb();
  }

  return locals.pageTemplateIds;
};
