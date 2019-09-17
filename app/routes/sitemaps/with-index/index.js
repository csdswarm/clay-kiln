'use strict';

const _get = require('lodash/get'),
  { wrapInTryCatch } = require('../../../services/startup/middleware-utils'),
  db = require('../../../services/server/db'),
  addUpdate = require('./add-update'),
  types = require('./types'),
  xmlIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  /**
   * returns the resulting sitemap index xml
   *
   * @param {object} req
   * @param {object[]} rows
   * @param {string} sitemapType
   * @returns {string}
   */
  getIndexXml = (req, rows, sitemapType) => {
    const fullBaseUrl = req.protocol + '://' + req.get('host') + req.baseUrl;
    let result = xmlIndexHeader;

    for (const { lastmod, num } of rows) {
      result += `<sitemap><loc>${fullBaseUrl}/${sitemapType}/${num}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`;
    }

    result += '</sitemapindex>';

    return result;
  },
  /**
   * adds the GET '/index.xml' endpoint
   *
   * @param {object} router
   * @param {string} sitemapType
   */
  addGetIndex = (router, sitemapType) => {
    router.get(`/${sitemapType}/index.xml`, wrapInTryCatch(async (req, res) => {
      const result = await db.raw(`
        SELECT num, lastmod
        FROM sitemap_with_index
        WHERE type = '${sitemapType}'
        ORDER BY num
      `);

      if (!result.rows.length) {
        res.status(404).end();
      } else {
        res.set('Content-Type', 'application/xml');
        res.send(getIndexXml(req, result.rows, sitemapType));
      }
    }));
  },
  /**
   * adds the GET '/${sitemapNum}.xml' endpoint
   *
   * @param {object} router
   * @param {string} sitemapType
   */
  addGetSitemap = (router, sitemapType) => {
    router.get(`/${sitemapType}/:id(\\d+).xml`, wrapInTryCatch(async (req, res) => {
      const result = await db.raw(`
          SELECT content
          FROM sitemap_with_index
          WHERE type = '${sitemapType}'
            AND num = ${req.params.id}
        `),
        { content } = _get(result, 'rows[0]', {});

      if (!content) {
        res.status(404).end();
      } else {
        res.set('Content-Type', 'application/xml');
        res.send(content);
      }
    }));
  },
  /**
   * For each sitemap type we add a GET '/index.xml', GET '/${sitemapNum}.xml'
   *   and POST '/update' endpoints.
   *
   * @param {object} router
   */
  addRoutes = router => {
    for (const sitemapType of Object.values(types)) {
      if (!addUpdate[sitemapType]) {
        throw new Error(`an update route needs to be defined for the sitemap '${sitemapType}'`);
      }

      addGetIndex(router, sitemapType);
      addGetSitemap(router, sitemapType);
      addUpdate[sitemapType](router);
    }
  };

module.exports = { addRoutes };
