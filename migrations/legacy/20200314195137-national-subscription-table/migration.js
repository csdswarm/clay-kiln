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
      last_updated_utc timestamptz(0) default (now() at time zone 'utc'),
      filter jsonb
    )
  `)

  // the following two queries were mostly grabbed from SO
  // https://stackoverflow.com/a/9556527

  await db.query(`
    create or replace function update_last_updated_utc()
    returns trigger as $func$
    begin
      new.last_updated_utc = now() at time zone 'utc';
      return new;
    end
    $func$ language plpgsql;
  `)

  await db.query(`
    create trigger update_last_updated_utc
    before update
    on national_subscriptions
    for each row execute procedure update_last_updated_utc();
  `)

  console.log(
    'done creating national_subscriptions and the auto-update trigger'
  );
})
