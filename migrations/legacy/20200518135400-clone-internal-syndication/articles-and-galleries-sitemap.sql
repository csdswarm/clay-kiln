DROP MATERIALIZED VIEW IF EXISTS sitemap_articles_and_galleries;

--
-- The _components CTE holds all the component ids of the components we
--   care about
--
-- We don't want to include component instances where 'noIndexNoFollow' is true
--

CREATE MATERIALIZED VIEW sitemap_articles_and_galleries AS WITH _components AS (
  SELECT id FROM components.gallery g WHERE NOT (g.data @> '{"noIndexNoFollow": true}' OR g.data @> '{"syndicationStatus" : "cloned"}')
  UNION
  SELECT id FROM components.article a WHERE NOT (a.data @> '{"noIndexNoFollow": true}' OR a.data @> '{"syndicationStatus" : "cloned"}')
),
--
-- The _page_data CTE joins the component ids found above with the page's main
--   data.  Note our website expects there to only be a single item in main even
--   though it takes an array.
--
-- We then use the pages to
--   : only grab those which are published
--   : grab the published url and time it was published
--   : identify which 'sitemap page' each row belongs to, where pages are sized
--     to 50,000 rows.  (I can't think of a better name for this.  Unfortunately
--     'page' is overloaded here)
--
_page_data AS (
  SELECT
    ((ROW_NUMBER() OVER(order by p.meta ->> 'url') - 1) / 50000)::integer AS page,
    replace(p.meta ->> 'url', 'http://', 'https://') AS loc,
    (p.meta ->> 'publishTime') AS lastmod
  FROM
    public.pages p,
    jsonb_array_elements_text(p.data -> 'main') component(id)
    JOIN _components _c ON component.id = _c.id
  WHERE
    p.meta @> '{"published": true}'
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

CREATE UNIQUE INDEX idx_mv_sitemap_articles_and_galleries ON sitemap_articles_and_galleries(id);
