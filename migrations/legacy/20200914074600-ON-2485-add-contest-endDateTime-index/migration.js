'use strict';

const { usingDb } = require('../migration-utils').v2;

run();

async function run() {
  try {
    const indicesSql = "CREATE INDEX IF NOT EXISTS idx_contests_endDateTime ON components.contest ((data->'endDateTime'));";

    await usingDb(async db => await db.query(indicesSql));
    console.log("Successfully created indices for use with contest");
  } catch (err) {
    console.error(err);
  }
}