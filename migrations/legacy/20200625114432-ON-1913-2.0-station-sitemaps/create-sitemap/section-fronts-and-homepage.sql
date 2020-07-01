DROP MATERIALIZED VIEW IF EXISTS sitemap_station_section_fronts_and_homepage;

CREATE MATERIALIZED VIEW sitemap_station_section_fronts_and_homepage AS WITH _published_station_slugs AS (
  SELECT sf.data->>'stationSlug' AS station_slug
  from components."station-front" sf
    JOIN pages p ON sf.id = p.data->'main'->>0
      JOIN uris u ON p.id = u.data || '@published'
    WHERE sf.data->>'stationSlug' IS NOT NULL
    AND sf.data->>'stationSlug' != ''
),
_components AS (
  SELECT id, data->>'stationSlug' AS station_slug
  FROM components."section-front"
  
  UNION 
  
  SELECT id, data->>'stationSlug' AS station_slug
  FROM components."station-front"
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
    (p.meta ->> 'publishTime') AS lastmod,
	  _c.station_slug
  FROM
    public.pages p,
    jsonb_array_elements_text(p.data -> 'main') component(id)
      JOIN _components _c ON component.id = _c.id
	      JOIN _published_station_slugs pss ON _c.station_slug = pss.station_slug
  WHERE
    p.meta @> '{"published": true}'
),
--
-- The _urls CTE just molds _page_data into the page numbers and xml
--   <url> strings
--
_urls AS (
  SELECT
  page + 1 AS page,
	station_slug,
    xmlelement(name url, xmlelement(name loc, loc), xmlelement(name lastmod, lastmod)) AS xml_data
  FROM
    _page_data
)

-- And finally we wrap all _urls into each sitemap and leave the current
--   timestamp (in W3C datetime format)

 SELECT
  station_slug||'-'||page AS id,
  page,
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
  page,
  station_slug
ORDER BY
  page;

CREATE UNIQUE INDEX idx_mv_sitemap_station_section_fronts_and_homepage ON 
  sitemap_station_section_fronts_and_homepage(id);
