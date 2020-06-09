'use strict';

const { usingDb } = require('../migration-utils').v1;

usingDb(async db => {
  await db.query('drop table if exists components."branch-io"');

  console.log('table branch-io was dropped');
})
