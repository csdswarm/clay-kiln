SELECT
  id,
  data -> 'authors' AS authors,
  data -> 'byline'  AS byline
FROM
  components.article
WHERE
  jsonb_array_length(data -> 'authors') > 0
UNION
SELECT
  id,
  data -> 'authors' AS authors,
  data -> 'byline' AS byline
FROM
  components.gallery
WHERE
  jsonb_array_length(data -> 'authors') > 0
;
