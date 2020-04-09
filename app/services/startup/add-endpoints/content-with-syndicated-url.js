'use strict';

const db = require('amphora-storage-postgres'),
  { wrapInTryCatch } = require('../middleware-utils');

/**
 * Adds an endpoint which returns data needed by the importer during station
 *   migrations.  For instance the importer takes different flows depending if
 *   the request url is already syndicated in unity.
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/rdc/content-with-syndicated-url', wrapInTryCatch(async (req, res) => {
    const result = await db.raw(`
      select
        u.url as content_url,
        p.id as page_id,
        content.id as content_uri,
        content.data as content_data
      from (
        select id,
        data,
          data->>'syndicatedUrl' as syndicatedUrl,
          data->>'syndicationStatus' as syndicationStatus
        from components.article
        union
        select id,
        data,
          data->>'syndicatedUrl' as syndicatedUrl,
          data->>'syndicationStatus' as syndicationStatus
        from components.gallery
      ) as content
      join pages p on p.data->'main'->>0 = content.id
      join uris u on u.data = p.id
      where content.syndicationStatus = 'syndicated'
        and content.syndicatedUrl = ?
        and content.id not like '%@published'

      -- we limit 1 because there shouldn't be a case where multiple pieces of
      --   content are syndicated from the same canonical
      --
      -- * canonical is overloaded, in the context of station migrations it
      --   refers to the canonical as drupal stores it.  In unity the drupal
      --   canonical is stored as syndicatedUrl
      limit 1
    `, [req.query.url]);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
