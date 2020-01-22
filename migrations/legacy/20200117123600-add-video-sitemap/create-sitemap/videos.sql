DROP MATERIALIZED VIEW IF EXISTS sitemap_videos;

CREATE MATERIALIZED VIEW sitemap_videos AS WITH
    articles_and_galleries AS (
        SELECT id, data -> 'lead' -> 0 ->> '_ref' as lead 
			FROM components.gallery g 
			WHERE NOT a.data @> '{"noIndexNoFollow": true}' 
				AND data -> 'lead' -> 0 ->> '_ref' IS NOT NULL
        UNION
        SELECT id, data -> 'lead' -> 0 ->> '_ref' as lead 
			FROM components.article a 
			WHERE NOT a.data @> '{"noIndexNoFollow": true}' 
				AND data -> 'lead' -> 0 ->> '_ref' IS NOT NULL
    ),
	lead_brightcove AS (
		SELECT 
			ag.id as content_id, 
			bc.id as video_id,
			xmlelement(name video, 
				xmlelement(name thumbnail_loc, bc.data ->> 'thumbnailUrl'),
				xmlelement(name title, bc.data ->> 'name'),
				xmlelement(name description, bc.data ->> 'seoDescription'),
				xmlelement(name content_loc, bc.data ->> 'seoEmbedUrl'),
				xmlelement(name duration, bc.data ->> 'duration'),
				xmlelement(name view_count, bc.data ->> 'views'),
				xmlelement(name publication_date, bc.data ->> 'bcPublishedAt')
			) as videoXML
		FROM components.brightcove bc
		JOIN articles_and_galleries ag 
			ON ag.lead = bc.id
	),
	_page_data AS (
	  SELECT
		((ROW_NUMBER() OVER(order by p.meta ->> 'url') - 1) / 50000)::integer AS page,
		replace(p.meta ->> 'url', 'http://', 'https://') AS loc,
		(p.meta ->> 'publishTime') AS lastmod,
		lb.videoXML as video
	  FROM
		public.pages p,
		jsonb_array_elements_text(p.data -> 'main') component(id)
		JOIN lead_brightcove lb ON concat(component.id, '@published') = lb.content_id
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
		xmlelement(name url, xmlelement(name loc, loc), xmlelement(name lastmod, lastmod), video) AS xml_data
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

SELECT * FROM sitemap_videos;