'use strict';

const db = require('../services/server/db'),
  { wrapInTryCatch } = require('../services/startup/middleware-utils'),
  xmlIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  /**
   * returns the resulting sitemap index xml
   *
   * @param {object} req
   * @param {object[]} rows
   * @returns {string}
   */
  getIndexXml = (req, rows) => {
    const fullBaseUrl = req.protocol + '://' + req.get('host') + req.baseUrl;
    let result = xmlIndexHeader;

    for (const { id, last_updated } of rows) {
      result += `<sitemap><loc>${fullBaseUrl}/sitemap-${id}.xml</loc><lastmod>${last_updated}</lastmod></sitemap>`;
    }

    result += '</sitemapindex>';

    return result;
  };

module.exports = router => {
  router.get('/sitemap-:id.xml', wrapInTryCatch(async (req, res, next) => {
    const result = await db.raw(`
      SELECT data
      FROM sitemap
      WHERE id = '${req.params.id}'
    `);

    if (!result.rows[0]) {
      return next();
    }

    res.set('Content-Type', 'application/xml');
    res.send(result.rows[0].data);
  }));

  router.get('/sitemap-index.xml', wrapInTryCatch(async (req, res, next) => {
    const result = await db.raw(`
      SELECT id, last_updated
      FROM sitemap
    `);

    if (!result.rows.length) {
      return next();
    }

    res.set('Content-Type', 'application/xml');
    res.send(getIndexXml(req, result.rows));
  }));

  router.post('/update-sitemaps', wrapInTryCatch(async (req, res) => {
    await db.raw('REFRESH MATERIALIZED VIEW CONCURRENTLY sitemap');
    res.status(200).end();
  }));
};
