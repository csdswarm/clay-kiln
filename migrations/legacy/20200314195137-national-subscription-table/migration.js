'use strict';

const { usingDb } = require('../../utils/migration-utils').v1;

usingDb(async db => {
  await db.query(`
    create table national_subscriptions (
      id serial primary key,
      short_desc varchar(50),
      station_slug varchar,
      -- timestamptz(0) <-- 0 here is the precision that means no fractions of
      -- a second
      last_updated_utc timestamptz(0),
      filter jsonb
    )
  `)

  console.log('done creating national_subscriptions');
})
