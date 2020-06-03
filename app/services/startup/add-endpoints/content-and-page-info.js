'use strict';

const db = require('amphora-storage-postgres'),
  { preventFastlyCache, wrapInTryCatch } = require('../middleware-utils');

/**
 * Returns info if the passed url is published in unity.  This is used by
 *   the importer.
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/rdc/station-migration/content-and-page-info', wrapInTryCatch(async (req, res) => {
    preventFastlyCache(res);

    const result = await db.raw(`
      select
        p.id as page_id,
        content.id as content_uri,
        content.data as content_data
      from (
        select id,
          data
        from components.article
        union
        select id,
          data
        from components.gallery
      ) as content
      join pages p on p.data->'main'->>0 = content.id
      join uris u on u.data = p.id
      where u.url = ?
    `, [req.query.url]);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
