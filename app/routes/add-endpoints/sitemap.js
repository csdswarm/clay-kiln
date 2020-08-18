'use strict';

const _snakeCase = require('lodash/snakeCase'),
  _kebabCase = require('lodash/kebabCase'),
  db = require('../../services/server/db'),
  { updatePodcasts } = require('../../services/server/podcasts'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),

  xmlIndexHeader = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  sitemapViews = new Set([
    'sitemap_articles_and_galleries',
    'sitemap_section_fronts_and_homepage',
    'sitemap_authors',
    'sitemap_topics',
    'sitemap_podcasts'
  ]),
  query = {
    sitemapIndex: getSitemapIndexQuery(sitemapViews),
    refreshViews: getRefreshViewsQuery(sitemapViews)
  },
  /**
   * returns the resulting sitemap index xml
   *
   * @param {object} req
   * @param {object[]} rows
   * @returns {string}
   */
  getIndexXml = (req, rows) => {
    const protocolAndHost = process.env.CLAY_SITE_PROTOCOL + '://' + req.get('host');
    let result = xmlIndexHeader;

    for (const { last_updated, sitemap_id } of rows) {
      result += `<sitemap><loc>${protocolAndHost}/${sitemap_id}.xml</loc><lastmod>${last_updated}</lastmod></sitemap>`;
    }

    result += '</sitemapindex>';

    return result;
  };

/**
 * Returns a single query which selects the sitemap ids along with their last
 *   updated timestamp
 *
 * @param {Set} sitemapViews
 * @returns {string}
 */
function getSitemapIndexQuery(sitemapViews) {
  return Array.from(sitemapViews)
    .map(viewName => `
      SELECT '${_kebabCase(viewName)}-' || id as sitemap_id,
        last_updated
      FROM ${viewName}
    `)
    .join('\nUNION\n');
}

/**
 * Returns a single query which refreshes all our sitemap materialized views
 *
 * @param {Set} sitemapViews
 * @returns {string}
 */
function getRefreshViewsQuery(sitemapViews) {
  return Array.from(sitemapViews)
    .map(viewName => `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName};`)
    .join('\n');
}

module.exports = router => {
  router.get('/sitemap-:name([a-z][a-z-]+[a-z])-:id(\\d+).xml', wrapInTryCatch(async (req, res, next) => {
    const viewName = 'sitemap_' + _snakeCase(req.params.name);

    if (!sitemapViews.has(viewName)) {
      return next();
    }

    // this shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const result = await db.raw(`
      SELECT data
      FROM ${viewName}
      WHERE id = ${req.params.id}
    `);

    if (!result.rows[0]) {
      return next();
    }

    res.set('Content-Type', 'application/xml');
    res.send(result.rows[0].data);
  }));

  router.get('/sitemap-index.xml', wrapInTryCatch(async (req, res, next) => {
    const result = await db.raw(query.sitemapIndex);

    if (!result.rows.length) {
      return next();
    }

    res.set('Content-Type', 'application/xml');
    res.send(getIndexXml(req, result.rows));
  }));

  router.post('/update-sitemaps', wrapInTryCatch(async (req, res) => {
    await updatePodcasts({ locals: req.locals }); // ensure that the podcasts data in db is updated before creating the sitemap using that data
    await db.raw(query.refreshViews);
    res.status(200).end();
  }));
};
