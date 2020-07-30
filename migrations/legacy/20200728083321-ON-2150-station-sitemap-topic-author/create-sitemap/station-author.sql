DROP MATERIALIZED VIEW IF EXISTS sitemap_station_authors;

CREATE MATERIALIZED VIEW sitemap_station_authors AS 
  WITH
    -- Get components so that we have access to the authors and can filter out any no-index/no-follow items
    _components AS (
      SELECT 
        id,
        d ->>'slug' AS author_slug,
        data ->>'stationSlug' AS station_slug
      FROM
        components.article a,
        jsonb_array_elements(a.data -> 'authors') d
      WHERE
        a.data ->> 'noIndexNoFollow' != 'true'

      UNION

      SELECT 
        id, 
        d ->>'slug' AS author_slug, 
        data ->>'stationSlug' AS station_slug
      FROM
        components.gallery g, jsonb_array_elements(g.data -> 'authors') d
      WHERE
        g.data ->> 'noIndexNoFollow' != 'true'
      ),
/*
  NOTE:
  Work for grouping by 50k pages is currently omitted
  as it is likely to be quite a while before we are at 50k authors,
  if ever.

  The base URL (`{{baseUrl}}`) is set based on environment during migration.
*/
    _page_data AS (
      SELECT
        station_slug,
        '{{baseUrl}}/' || _c.station_slug || '/authors/' || _c.author_slug AS loc,
        MAX((p.meta ->> 'publishTime')::timestamptz) AS lastmod
        FROM
          public.pages p,
          jsonb_array_elements_text(p.data -> 'main') component(id)
            JOIN _components _c
                ON component.id = _c.id
        WHERE
        p.meta @> '{"published": true}'
      GROUP BY
        author_slug,
        station_slug
    ),

    _urls AS (
      SELECT
        station_slug,
        xmlelement(
          NAME url,
          xmlelement(NAME loc, loc),
          xmlelement(NAME lastmod, lastmod)
          ) AS xml_data
      FROM
        _page_data
    )
-- hard coding 1 as the id for now, so that it follows the same pattern as other mv sitemaps, some of which need to
-- create separate pages for each set of 50k entries, which is currently not an issue for authors.
  SELECT
    station_slug || '-1' AS id,
    to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_updated,
    xmlroot(
      xmlelement(
        NAME urlset,
        XMLATTRIBUTES('http://www.sitemaps.org/schemas/sitemap/0.9' AS xmlns),
        xmlagg(xml_data)
        ),
      VERSION '1.0" encoding="UTF-8' -- postgres does not have a direct way to add encoding
      )::text AS data
  FROM
    _urls
GROUP BY
  station_slug
ORDER BY
  station_slug;

-- required to refresh materialized views with concurrency (adding so as to be consistent with all other m views)
CREATE UNIQUE INDEX idx_mv_sitemap_station_authors ON 
  sitemap_station_authors(id);
