'use strict';
const { usingDb } = require('../../utils/migration-utils').v1,
  addProcedures = require('./add-procedures');

usingDb(async db => {

  console.log('altering content and national subscriptions...');
  await db.query(`
    alter table national_subscriptions
      add mapped_sectionfronts jsonb;
    
    alter table content_subscriptions
      add mapped_sectionfronts jsonb;
  `)

  await addProcedures(db);
  
  console.log('done content and national subscriptions');
})