'use strict';

const _get = require('lodash/get'),
  db = require('../services/server/db');
/**
 * Returns a standard site-map for all podcast show pages
 * @param {object} req
 * @param {object} res
 * @returns {Promise<object>}
 */

module.exports = async function (req, res) {
  const schemaLocationInfo = req.query.schemaCheck
      ? ', \'http://www.w3.org/2001/XMLSchema-instance\' as "xmlns:xsi", ' +
        "'http://www.sitemaps.org/schemas/sitemap/0.9 " +
        "https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd '" +
        ' as "xsi:schemaLocation"'
      : '',

    urlsInXMLFormatSQL = `
    SELECT id, xmlelement(name url,
      xmlelement(name loc, '' + data->'attributes'->>'site_slug'
    ) as xml_data
    FROM podcasts
    ORDER BY id ASC
    LIMIT 50000`,

    urlsetAggregationSQL = `
    SELECT
      xmlroot(
        xmlelement(name urlset,
          xmlattributes(
            'http://www.sitemaps.org/schemas/sitemap/0.9' as xmlns${schemaLocationInfo}
          ),
          xmlagg(xml_data)
        ), version '1.0" encoding="UTF-8' -- postgres does not have a direct way to add encoding
      )::text as data
    FROM _urls`,

    podcastsSiteMapSQL = `WITH _urls as (${urlsInXMLFormatSQL}) ${urlsetAggregationSQL};`,

    emptySiteMap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    </urlset>`,

    data = await db.raw(podcastsSiteMapSQL);

  res.type('application/xml');
  return res.send(_get(data, 'rows[0].data', emptySiteMap));
};
