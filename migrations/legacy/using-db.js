'use strict';

const { Pool } = require('../../app/node_modules/pg');

const assertEnvVarsPresent = () => {
  const { PGUSER, PGHOST, PGPASSWORD, PGDATABASE } = process.env

  if (!(PGUSER && PGHOST && PGPASSWORD && PGDATABASE)) {
    throw new Error(
      'in order to use the database, the following environment variables must be set'
      + '\nPGUSER\nPGHOST\nPGPASSWORD\nPGDATABASE'
    );
  }
}

const v1 = async cb => {
  let pool;

  assertEnvVarsPresent()

  try {
    pool = new Pool();
    await cb(pool);
  } catch (e) {
    console.error(e);
  } finally {
    try {
      if (pool) {
        pool.end();
      }
    } catch (e) {
      console.error(e);
    }
  }
};

module.exports = { v1 };
