WITH
  _data AS (
    SELECT
      d ->> 'id' AS id,
      d - 'id'   AS data -- removes id from the data entered.
    FROM
      jsonb_array_elements($1::jsonb) d
  ),
  -- This is how you update multiple tables in a single query. TA-DA.
  _update_articles AS (
    UPDATE
      components.article a
        SET
          data = a.data || _d.data
        FROM
          _data _d
        WHERE
          a.id = _d.id
        RETURNING
          a.id, a.data
  ),
  _update_galleries AS (
    UPDATE
      components.gallery g
        SET
          data = g.data || _d.data
        FROM
          _data _d
        WHERE
          g.id = _d.id
        RETURNING
          g.id, g.data
  )
SELECT
  id,
  data
FROM
  _update_articles
UNION
SELECT
  id,
  data
FROM
  _update_galleries;
