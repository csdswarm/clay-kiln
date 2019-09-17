'use strict';

const { wrapInTryCatch } = require('../../../services/startup/middleware-utils'),
  db = require('../../../services/server/db'),
  types = require('./types'),
  xmlSitemapHeader = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  selectXmlData = `
    SELECT xmlelement(name url,
      xmlelement(name loc, replace(meta->>'url', 'http\\://', 'https\\://')),
      xmlelement(name lastmod, meta->>'publishTime')
    ) as xml_data
  `,
  baseGallerySelect = `
    ${selectXmlData}
    FROM pages p
      JOIN components.gallery g ON p.data#>>'{main,0}' = g.id
    WHERE p.meta @> '{"published": true}'
      AND p.data#>>'{main, 0}' ~ '_components/gallery/'
      AND NOT g.data @> '{"noFollowNoIndex": true}'
    ORDER BY p.meta->>'url'
  `,
  // sitemaps can only hold 50,000 urls
  sitemapUrlLimit = 50000,
  /**
   * returns the resulting sitemap xml
   *
   * @param {object[]} rows
   * @returns {string}
   */
  getSitemapContent = rows => {
    console.log('rows: ' + JSON.stringify(rows, null, 2));
    return xmlSitemapHeader + rows.map(aRow => aRow.xml_data).join('') + '</urlset>';
  },
  /**
   * adds the POST '/update' for articles
   *
   * @param {object} router
   */
  addSitemap = async ({ type, num, content }) => {
    console.log('content: ' + content);
    await db.raw(`
      INSERT INTO sitemap_with_index (type, num, content, lastmod)
      VALUES (
        '${type}',
        ${num},
        ?,
        ?
      )
    `, [content, new Date().toISOString()]);
  },
  article = router => {
    router.post(`/${types.article}/update`, wrapInTryCatch(async (req, res) => {
      await db.raw(`
        DELETE FROM sitemap_with_index
        WHERE type = '${types.article}'
      `);

      for (let offsetMultiplier = 0; true; offsetMultiplier += 1) {
        const result = await db.raw(`
          ${selectXmlData}
          FROM pages p
            JOIN components.article a ON p.data#>>'{main,0}' = a.id
          WHERE p.meta @> '{"published": true}'
            AND p.data#>>'{main, 0}' ~ '_components/article/'
            AND NOT a.data @> '{"noFollowNoIndex": true}'
          ORDER BY p.meta->>'url'
          LIMIT ${sitemapUrlLimit}
          OFFSET ${sitemapUrlLimit * offsetMultiplier}
        `);

        if (!result.rows.length) {
          break;
        }

        await addSitemap({
          type: types.article,
          num: offsetMultiplier + 1,
          content: getSitemapContent(result.rows)
        });

        if (result.rows.length < sitemapUrlLimit) {
          break;
        }
      }

      res.status(200).end();
    }));
  },
  /**
   * adds the POST '/update' for section fronts and galleries
   *
   * @param {object} router
   */
  sectionFrontsAndGalleries = router => {
    router.post(`/${types.sectionFrontsAndGalleries}/update`, wrapInTryCatch(async (req, res) => {
      await db.raw(`
        DELETE FROM sitemap_with_index
        WHERE type = '${types.sectionFrontsAndGalleries}'
      `);

      // first let's add the section fronts because there won't be nearly 50000
      const sectionFrontResult = await db.raw(`
          ${selectXmlData}
          FROM pages
          WHERE meta @> '{"published": true}'
            AND data#>>'{main, 0}' ~ '_components/section-front/'
          ORDER BY meta->>'url';
        `),
        galleryResult = await db.raw(`
          ${baseGallerySelect}
          LIMIT ${sitemapUrlLimit - sectionFrontResult.rows.length}
        `),
        rows = sectionFrontResult.rows.concat(galleryResult.rows);

      if (!rows.length) {
        res.status(200).end();
        return;
      }

      addSitemap({
        type: types.sectionFrontsAndGalleries,
        num: 1,
        content: getSitemapContent(rows)
      });

      if (rows.length < sitemapUrlLimit) {
        res.status(200).end();
        return;
      }

      for (let offsetMultiplier = 1; true; offsetMultiplier += 1) {
        const result = await db.raw(`
          ${baseGallerySelect}
          LIMIT ${sitemapUrlLimit}
          OFFSET ${(sitemapUrlLimit * offsetMultiplier) - sectionFrontResult.rows.length}
        `);

        if (!result.rows.length) {
          break;
        }

        addSitemap({
          type: types.sectionFrontsAndGalleries,
          num: offsetMultiplier + 1,
          content: getSitemapContent(result.rows)
        });

        if (result.rows.length < sitemapUrlLimit) {
          break;
        }
      }

      res.status(200).end();
    }));
  };

module.exports = {
  [types.article]: article,
  [types.sectionFrontsAndGalleries]: sectionFrontsAndGalleries
};
