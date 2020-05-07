SELECT
  id,
  data -> 'items' AS items
FROM
  components.tags
WHERE
  jsonb_array_length(data -> 'items') > 0;
