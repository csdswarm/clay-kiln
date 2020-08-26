UPDATE public.pages
SET meta = JSONB_SET(
  meta,
  '{url}',
  (meta -> 'urlHistory' -> 0),
  false)
 WHERE (meta ->> 'url') like '%migrate%'
 AND meta -> 'urlHistory' -> 0 is not null;