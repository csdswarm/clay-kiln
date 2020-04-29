DROP MATERIALIZED VIEW IF EXISTS sitemap_section_fronts_and_homepage;

--
-- The _components CTE holds all the component ids of the components we
--   care about
--
CREATE MATERIALIZED VIEW sitemap_section_fronts_and_homepage AS WITH _components AS (
  SELECT id FROM components.homepage
  UNION
  SELECT id FROM components."section-front"
),
--
-- The _page_data CTE joins the component ids found above with the page's main
--   data.  Note our website expects there to only be a single item in main even
--   though it takes an array.
--
-- We then use the pages to
--   : only grab those which are published
--   : grab the published url and time it was published
--
_page_data AS (
  SELECT
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
-- The _urls CTE turns 'loc' and 'lastmod' into a <url> element
--
_urls AS (
  SELECT
    xmlelement(name url, xmlelement(name loc, loc), xmlelement(name lastmod, lastmod)) AS xml_data
  FROM
    _page_data
)
--
-- And finally we wrap all _urls into each sitemap and leave the current
--   timestamp (in W3C datetime format)
--
-- Note 'id' is hardcoded to 1 because in the other sitemap tables the id is the
--   sitemap page.  This table will never have 50,000 records and thus doesn't
--   need pages.  To keep the code simple though we want the tables to all have
--   the same column names... and the reason we don't want all the sitemap data
--   to be held in a single materialized view is that makes maintaining it more
--   difficult (i.e. it's harder for multiple devs to update it at the
--   same time)
--
SELECT
  1 as id,
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
  _urls;

--
-- this allows us to 'refresh materialized view concurrently' without hardcoding
--   which tables have unique constraints or querying for it in advance.
--
CREATE UNIQUE INDEX idx_mv_sitemap_section_fronts_and_homepage ON sitemap_section_fronts_and_homepage(id);
