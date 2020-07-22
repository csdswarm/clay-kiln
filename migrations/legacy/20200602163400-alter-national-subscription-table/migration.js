'use strict';

const { usingDb } = require('../../utils/migration-utils').v1;

usingDb(async db => {
  console.log('altering national_subscriptions...');
  await db.query(`
    alter table national_subscriptions
      add from_station_slug varchar
  `)

  console.log('done altering national_subscriptions');
})
