'use strict';

const { usingDb } = require('../../utils').v2,
  addProcedures = require('./add-procedures'),
  addTriggers = require('./add-triggers');

usingDb(async db => {
  await db.query(`
    drop table if exists content_subscriptions;

    create table content_subscriptions (
      id serial primary key,
      short_desc varchar(50),
      station_slug varchar,
      last_updated_utc timestamptz(0),
      filter jsonb,
      from_station_slug varchar
    );

    insert into content_subscriptions
    select * from national_subscriptions;

    -- ensures the serial values are in sync between the tables
    select setval(
      'content_subscriptions_id_seq',
      (select nextval('national_subscriptions_id_seq'::regclass))
    );
  `);

  await addProcedures(db);
  await addTriggers(db);

  console.log('content_subscriptions and supporting triggers added successfully');
}).catch(console.error);
