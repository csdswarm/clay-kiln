'use strict';

const _get = require('lodash/get'),
  db = require('../services/server/db');
/**
 * Returns a google news style site-map for all articles published recently
 * @param {object} req
 * @param {object} res
 * @returns {Promise<object>}
 */

module.exports = async function (req, res) {
  const NUMBER_OF_DAYS_TO_RETRIEVE = 2,
    PUBLICATION_NAME = 'RADIO.COM',
    schemaLocationInfo = req.query.schemaCheck
      ? ', \'http://www.w3.org/2001/XMLSchema-instance\' as "xmlns:xsi", ' +
        "'http://www.sitemaps.org/schemas/sitemap/0.9 " +
        'https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd ' +
        'http://www.google.com/schemas/sitemap-news/0.9 ' +
        "https://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd'" +
      ' as "xsi:schemaLocation"'
      : '',
    urlsInGoogleNewsFormatSQL = `
    SELECT COALESCE(p.meta->>'publishTime', p.meta->>'updateTime')::timestamp as published, xmlelement(name url, 
      xmlelement(name loc, replace(COALESCE(p.meta->>'url', pub.data->>'customUrl'), 'http://', 'https://')),
      xmlelement(name "news:news", 
        xmlelement(name "news:publication", 
          xmlelement(name "news:name", '${PUBLICATION_NAME}'),
          xmlelement(name "news:language", 'en')
        ),
        xmlelement(name "news:publication_date", COALESCE(p.meta->>'publishTime', p.meta->>'updateTime')::timestamptz),
        xmlelement(name "news:title", p.meta->>'title')
      )
    ) as xml_data
    FROM 
      public.pages pub
        INNER JOIN public.pages p ON pub.id ~ '@published$' AND LEFT(pub.id, -10) = p.id, 
        jsonb_array_elements_text(pub.data->'main') article_id
        INNER JOIN components.article a ON article_id = a.id
    WHERE 
      COALESCE(p.meta->>'publishTime', p.meta->>'updateTime')::date > current_date - ${NUMBER_OF_DAYS_TO_RETRIEVE}
      AND NOT (a.data @> '{"noIndexNoFollow": true}' OR a.data @> '{"syndicationStatus" : "cloned"}')
      AND NOT p.meta @> '{"published": false}'
    ORDER BY 
      published DESC
    LIMIT 1000`,

    urlsetAggregationSQL = `
    SELECT 
      xmlroot(
        xmlelement(name urlset, 
          xmlattributes(
            'http://www.sitemaps.org/schemas/sitemap/0.9' as xmlns,
            'http://www.google.com/schemas/sitemap-news/0.9' as "xmlns:news"${schemaLocationInfo}
          ),
          xmlagg(xml_data)
        ), version '1.0" encoding="UTF-8' -- postgres does not have a direct way to add encoding
      )::text as data
    FROM _urls`,

    googleNewsSiteMapSQL = `WITH _urls as (${urlsInGoogleNewsFormatSQL}) ${urlsetAggregationSQL};`,
    emptySiteMap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset 
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
      xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    </urlset>`,

    data = await db.raw(googleNewsSiteMapSQL);

  res.type('application/xml');
  return res.send(_get(data, 'rows[0].data', emptySiteMap));
};
