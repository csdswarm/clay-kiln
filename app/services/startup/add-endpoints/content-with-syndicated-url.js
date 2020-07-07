'use strict';

const db = require('amphora-storage-postgres'),
  { preventFastlyCache, wrapInTryCatch } = require('../middleware-utils');

/**
 * Returns info about content which has been marked as syndicated from the
 *   passed url.  This is used by the importer.
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/rdc/content-with-syndicated-url', wrapInTryCatch(async (req, res) => {
    preventFastlyCache(res);

    const result = await db.raw(`
      SELECT
        u.url AS content_url,
        p.id AS page_id,
        content.id AS content_uri,
        content.data AS content_data
      FROM (
        SELECT id,
          data,
          data->>'syndicatedUrl' AS syndicatedUrl,
          data->>'syndicationStatus' AS syndicationStatus
        FROM components.article
      ) AS content
      JOIN pages p ON p.data->'main'->>0 = content.id
      JOIN uris u ON u.data = p.id
      WHERE content.syndicationStatus = 'syndicated'
        AND content.syndicatedUrl = ?
        AND content.id NOT LIKE '%@published'
      UNINON
      SELECT
        u.url AS content_url,
        p.id AS page_id,
        content.id AS content_uri,
        content.data AS content_data
      FROM (
        SELECT id,
          data,
          data->>'syndicatedUrl' AS syndicatedUrl,
          data->>'syndicationStatus' AS syndicationStatus
        FROM components.gallery
      ) AS content
      JOIN pages p ON p.data->'main'->>0 = content.id
      JOIN uris u ON u.data = p.id
      WHERE content.syndicationStatus = 'syndicated'
        AND content.syndicatedUrl = ?
        AND content.id NOT LIKE '%@published'

      -- we limit 1 because there shouldn't be a case where multiple pieces of
      --   content are syndicated from the same canonical
      --
      -- * canonical is overloaded, in the context of station migrations it
      --   refers to the canonical AS drupal stores it.  In unity the drupal
      --   canonical is stored AS syndicatedUrl
      LIMIT 1
    `, [req.query.url, req.query.url]);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
