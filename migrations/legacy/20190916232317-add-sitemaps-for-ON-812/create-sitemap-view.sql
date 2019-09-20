--
-- README
--   This view generates all sitemaps which follow the 'Sitemap protocol'
--   https://www.sitemaps.org/protocol.html
--
--   It's a materialized view because we only need to update the data every so
--   often, meaning we don't need it to produce real-time data every query.
--

DROP MATERIALIZED VIEW IF EXISTS sitemap;

--
-- The _components CTE contains the mappings we need from each component
--   : component id
--   : which sitemap it belongs to
--
-- We don't want to include component instances where 'noIndexNoFollow' is true
--

CREATE MATERIALIZED VIEW sitemap AS WITH _components AS (
  SELECT
    id,
    'articles-and-galleries' AS sitemap
  FROM
    components.gallery g
  WHERE
    g.data ->> 'noIndexNoFollow' != 'true'
  UNION
  SELECT
    id,
    'articles-and-galleries' AS sitemap
  FROM
    components.article a
  WHERE
    a.data ->> 'noIndexNoFollow' != 'true'
  UNION
  SELECT
    id,
    'section-fronts-and-homepage' AS sitemap
  FROM
    components.homepage
  UNION
  SELECT
    id,
    'section-fronts-and-homepage' AS sitemap
  FROM
    components."section-front"
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
    _c.sitemap,
    (ROW_NUMBER() OVER (PARTITION BY _c.sitemap ORDER BY p.meta ->> 'url') - 1) / 50000 AS page,
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
-- The _urls CTE just molds _page_data into the sitemap file names and
--   xml <url> strings
--
_urls AS (
  SELECT
    sitemap || '-' || ((page + 1)::text) AS sitemap,
    xmlelement(name url, xmlelement(name loc, loc), xmlelement(name lastmod, lastmod)) AS xml_data
  FROM
    _page_data
)
--
-- And finally we wrap all _urls into each sitemap and leave the current
--   timestamp (in W3C datetime format)
--
SELECT
  sitemap as id,
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
  sitemap
ORDER BY
  sitemap;

CREATE UNIQUE INDEX idx_mv_sitemap ON sitemap(id);
