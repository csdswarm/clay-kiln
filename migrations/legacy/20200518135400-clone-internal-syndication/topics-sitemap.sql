DROP MATERIALIZED VIEW IF EXISTS sitemap_topics;

CREATE MATERIALIZED VIEW sitemap_topics AS
  WITH
    -- Get components so that we have access to the topics and can filter out any no-index/no-follow items
    _components (id, topic) AS (
      SELECT
        a.id,
        d ->> 'slug'
      FROM
        components.article a
          JOIN components.tags t
               ON a.data #>> '{tags,_ref}' = t.id,
        jsonb_array_elements(t.data -> 'items') d
      WHERE NOT
        (a.data @> '{"noIndexNoFollow": true}' OR a.data @> '{"syndicationStatus" : "cloned"}')
      UNION
      SELECT
        g.id,
        d ->> 'slug'
      FROM
        components.gallery g
          JOIN components.tags t
               ON g.data #>> '{tags,_ref}' = t.id,
        jsonb_array_elements(t.data -> 'items') d
      WHERE NOT
        (g.data @> '{"noIndexNoFollow": true}' OR g.data @> '{"syndicationStatus" : "cloned"}')
    ),
    /*
      NOTE:
      Work for grouping by 50k pages is currently omitted
      as it is likely to be quite a while before we are at 50k topics,
      if ever.

      The base URL (`{{baseUrl}}`) is set based on environment during migration.
    */
    _page_data AS (
      SELECT
        '{{baseUrl}}/topic/' || _c.topic AS loc,
        MAX((p.meta ->> 'publishTime')::timestamptz) AS lastmod
      FROM
        public.pages p,
        jsonb_array_elements_text(p.data -> 'main') component(id)
          JOIN _components _c
               ON component.id = _c.id
      WHERE
        p.meta @> '{"published": true}'
      GROUP BY
        topic
    ),
    _urls AS (
      SELECT
        xmlelement(
          NAME url,
          xmlelement(NAME loc, loc),
          xmlelement(NAME lastmod, lastmod)
          ) AS xml_data
      FROM
        _page_data
    )
-- hard coding 1 as the id for now, so that it follows the same pattern as other mv sitemaps, some of which need to
-- create separate pages for each set of 50k entries, which is currently not an issue for topics.
  SELECT
    1 AS id,
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
    _urls;

-- required to refresh materialized views with concurrency (adding so as to be consistent with all other m views)
CREATE UNIQUE INDEX idx_mv_sitemap_topics ON sitemap_topics(id);
