'use strict';

const db = require('../services/server/db');

module.exports = async function (req, res) {
  const NUMBER_OF_DAYS_TO_RETRIEVE = 2,
    urlsList = `
    SELECT id, xmlelement(name url, 
      xmlelement(name loc, replace(meta->>'url', 'http://', 'https://')),
      xmlelement(name "news:news", 
        xmlelement(name "news:publication", 
          xmlelement(name "news:name", 'RADIO.COM'),
          xmlelement(name "news:language", 'en')
        ),
        xmlelement(name "news:publication_date", (meta->>'publishTime')::timestamptz),
        xmlelement(name "news:title", meta->>'title')
      )
    ) as xml_data
    FROM public.pages
    WHERE 
      meta @> '{"published": true}'
      AND (meta->>'publishTime')::date > current_date - ${NUMBER_OF_DAYS_TO_RETRIEVE}
      AND data#>>'{main, 0}' ~ '_components/article/'`,
    aggregateUrls = `
    SELECT 
      xmlroot(
        xmlelement(name urlset, 
          xmlattributes(
            'http://www.sitemaps.org/schemas/sitemap/0.9' as xmlns,
            'http://www.google.com/schemas/sitemap-news/0.9' as "xmlns:news"
          ),
          xmlagg(xml_data)
        ), version '1.0" encoding="UTF-8' -- postgres does not have a direct way to add encoding
      )::text as data
    FROM _urls`,
    data = await db.raw(`WITH _urls as (${urlsList}) ${aggregateUrls};`),
    gotData = data && data.rows && data.rows.length;

  res.set('Content-Type', 'text/xml');
  if (gotData) {
    return res.send(data.rows[0].data);
  }  else {
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset 
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      </urlset>`);
  }
};
