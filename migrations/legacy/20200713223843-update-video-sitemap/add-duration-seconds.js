'use strict';

/**
 * updates the duration from the iso string which was incorrectly storing the
 *   duration in milliseconds - to the number in seconds
 */

const migrationUtils = require('../../utils/migration-utils').v1;

const { dbCursor, moment } = migrationUtils,
  { read, usingCursor } = dbCursor,
  requestNumRows = 1

module.exports = async db => {
  const cursorQuery = `
    select *
    from components.brightcove

    -- P stands for 'period' and is the first letter in an ISO string
    --   for duration, which is how durations are currently (incorrectly)
    --   being saved
    where data->>'duration' like 'P%'
  `;

  return usingCursor({ db, pgCursorArgs: [cursorQuery, []] }, async cursor => {
    let rows;

    do {
      rows = await read(requestNumRows, cursor);

      if (rows.length) {
        await updateDuration(db, rows);
      }
    } while (rows.length === requestNumRows);
  });
};

function toSeconds(duration) {
  return Math.round(moment.duration(duration)._milliseconds / 1000)
}

function updateDuration(db, rows) {
  const values = rows.map(({ id, data }) => {
      const durationSeconds = toSeconds(data.duration);

      return `('${id}', ${durationSeconds})`;
    })
    .join(',\n');


  return db.query(`
    update components.brightcove b
    set data = jsonb_set(b.data, '{durationSeconds}', to_jsonb(v.duration))
    from (values
      ${values}
    ) as v(id, duration)
    where b.id = v.id
  `);
}
