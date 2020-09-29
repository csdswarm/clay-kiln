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

    // A Union was removed from here as it's too taxing on the DB, splitting into multiple queries reduces overall timing
    const query = `
      SELECT
        p.id AS page_id,
        content.id AS content_uri,
        content.data AS content_data
      FROM (
        SELECT id,
          data
        FROM ??
      ) AS content
      JOIN pages p ON p.data->'main'->>0 = content.id
      JOIN uris u ON u.data = p.id
      WHERE u.url = ?
    `;

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
  router.get('/rdc/generic-page-info', wrapInTryCatch(async (req, res) => {
    preventFastlyCache(res);

    const result = await db.raw(`
      SELECT id, data, meta
      FROM pages 
      WHERE meta->>'url' LIKE 'http%://${req.query.url}'
    `);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
