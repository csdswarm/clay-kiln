WITH
  _data AS (
    SELECT
      d ->> 'id' AS id,
      d - 'id'   AS data
    FROM
      jsonb_array_elements($1::jsonb) d
  )
UPDATE
  components.tags t
SET
  data = t.data || _d.data
FROM
  _data _d
WHERE
  t.id = _d.id
RETURNING
  t.id, t.data;
