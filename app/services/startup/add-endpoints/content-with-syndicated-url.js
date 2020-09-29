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

    // A Union was removed from here as it's too taxing on the DB, splitting into multiple queries reduces overall timing
    const query = `
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
        FROM ??
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
    `;

    // First check for articles
    let result = await db.raw(query, ['components.article', req.query.url]);

    // If there were no articles then check galleries
    if (!result.rows.length) {
      result = await db.raw(query, ['components.gallery', req.query.url]);
    }

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
