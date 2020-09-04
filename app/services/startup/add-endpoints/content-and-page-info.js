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
      SELECT
        p.id AS page_id,
        content.id AS content_uri,
        content.data AS content_data
      FROM (
        SELECT id,
          data
        FROM components.article
      ) AS content
      JOIN pages p ON p.data->'main'->>0 = content.id
      JOIN uris u ON u.data = p.id
      WHERE u.url = ?
      UNION
      SELECT
        p.id AS page_id,
        content.id AS content_uri,
        content.data AS content_data
      FROM (
        SELECT id,
          data
        FROM components.gallery
      ) AS content
      JOIN pages p ON p.data->'main'->>0 = content.id
      JOIN uris u ON u.data = p.id
      WHERE u.url = ?
    `, [req.query.url, req.query.url]);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
  router.get('/rdc/station-migration/generic-page-info', wrapInTryCatch(async (req, res) => {
    preventFastlyCache(res);

    const result = await db.raw(`
      SELECT id, data, meta
      FROM pages 
      WHERE meta->>'url' = ?
    `, [req.query.url]);

    if (!result.rows.length) {
      res.status(404).end();
    } else {
      res.send(result.rows[0]);
    }
  }));
};
