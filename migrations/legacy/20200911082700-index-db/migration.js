'use strict';

const { usingDb } = require('../migration-utils').v2,
  { v1: { readFileAsync } } = require('../../utils/read-file');

run();

async function run() {
  try {
    const indicesSql = await readFileAsync('./sql/indices.sql', 'utf8');

    await usingDb(async db => await db.query(indicesSql));

    console.log("Successfully created indices for use with migrations");
  } catch (err) {
    console.error(err);
  }
}
