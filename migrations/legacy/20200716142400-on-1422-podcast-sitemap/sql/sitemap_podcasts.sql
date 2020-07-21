DROP MATERIALIZED VIEW IF EXISTS sitemap_podcasts;

CREATE MATERIALIZED VIEW sitemap_podcasts AS
WITH
_page_data AS (
  SELECT
    ((ROW_NUMBER() OVER(order by data->>'updated') - 1) / 50000)::integer AS page,
    data->>'url' AS loc,
    (data->>'updated') AS lastmod
  FROM public.podcasts
),
--
-- The _urls CTE just molds _page_data into the page numbers and xml
--   <url> strings
--
_urls AS (
  SELECT
    page + 1 as page,
    xmlelement(name url, xmlelement(name loc, loc), xmlelement(name lastmod, lastmod)) AS xml_data
  FROM
    _page_data
)
--
-- And finally we wrap all _urls into each sitemap and leave the current
--   timestamp (in W3C datetime format)
--
SELECT
  page as id,
  to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_updated,
  -- postgres does not have a direct way to add encoding
  xmlroot(
    xmlelement(
      name urlset,
      xmlattributes('http://www.sitemaps.org/schemas/sitemap/0.9' AS xmlns),
      xmlagg(xml_data)
    ),
    version '1.0" encoding="UTF-8'
  )::text AS data
FROM
  _urls
GROUP BY
  page
ORDER BY
  page;

CREATE UNIQUE INDEX idx_mv_sitemap_podcasts ON sitemap_podcasts(id);
