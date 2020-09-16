'use strict';
const { usingDb } = require('../../utils/migration-utils').v1,
  addProcedures = require('./add-procedures');

usingDb(async db => {

  console.log('altering content and national subscriptions...');
  await db.query(`
    alter table national_subscriptions
      add mapped_section_fronts jsonb;
    
    alter table content_subscriptions
      add mapped_section_fronts jsonb;
  `)

  await addProcedures(db);
  
  console.log('done content and national subscriptions');
})