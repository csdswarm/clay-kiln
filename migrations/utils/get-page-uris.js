'use strict';

const usingDb = require('./using-db').v2,
  { clayutils } = require('./base'),
  getPageUris_v1 = {
    fromContentComponentUris: fromContentComponentUris_v1
  };

/**
 * fetches the page uris from the content component uris.
 *
 * content components are basically components which can exist as the main
 *   content of a page.  Remember we only support pages with single main
 *   components uris, so in this case we're just going to check against the
 *   first element.
 *
 * also components that match multiple pages are unsupported (it's not a natural
 *   use-case).  In this case we're only grabbing the first page.
 *
 * the order of the page uris will be in the same order as the content component
 *   uris.  E.g. think of this as a more efficient way to run
 *   uris.map(getPageUri.fromContentComponentUri)
 *
 * @param {string[]} contentComponentUris
 * @returns {Promise<string[]>}
 */
function fromContentComponentUris_v1(allUris) {
  return usingDb(async db => {
    const pageUris = [];

    for (const uri of allUris) {
      const componentName = clayutils.getComponentName(uri),
        query = `
          select p.id
          from pages p
            join components.${componentName} cmpt on cmpt.id = p.data->'main'->>0
          where cmpt.id = $1
        `,
        result = await db.query(query, [uri]),
        pageId = result.rows[0].id;

      pageUris.push(pageId);
    }

    return pageUris;
  });
}

module.exports = {
  v1: getPageUris_v1,
};
