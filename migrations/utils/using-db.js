'use strict';
const setDbCredentials = require('./set-db-credentials').v1;

const host = process.argv[2] || 'clay.radio.com';
const pgIndex = process.argv.indexOf('-pg');
if (pgIndex !== -1) {
  [
    process.env.PGHOST,
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
  ] = process.argv.splice(pgIndex, 5).slice(1);
}

const { Pool } = require('../../app/node_modules/pg'),
  {
    PGUSER = 'postgres',
    PGHOST = 'localhost',
    PGPASSWORD = 'example',
    PGDATABASE = 'clay'
  } = process.env;

/**
 * Wraps a callback in a db pool that passes in the db connection
 * to process against
 * @param {function} cb
 * @returns {Promise<void>}
 * @example:
 * await usingDb(async db => {
 *  const sql = 'UPDATE some_table SET data=\'{...}\' WHERE ...';
 *  await db.query(sql);
 * });
 */
const v1 = async cb => {
  let pool;

  try {
    pool = new Pool({
      user: PGUSER,
      host: PGHOST,
      password: PGPASSWORD,
      database: PGDATABASE
    });
    await cb(pool);
  } finally {
    if (pool) {
      pool.end();
    }
  }
};

/**
 * this does the same thing as v1 except returns the result of `cb`
 * @deprecated use version 3 if possible
 * @param {function} cb - called with an instance of pg's Pool
 * @returns {*} - the result of cb
 * @example:
 * await usingDb(async db => {
 *  const sql = 'SELECT * FROM some_table';
 *  const data = await db.query(sql);
 * });
 * */
const v2 = async cb => {
  const pool = new Pool({
    user: PGUSER,
    host: PGHOST,
    password: PGPASSWORD,
    database: PGDATABASE
  });

  return cb(pool)
    .finally(() => {
      if (pool) {
        pool.end();
      }
    });
};

/**
 * This is the same as version 2, except that it loads db credentials from
 * the local encrypted entries, rather than requiring them to be coded in.
 *
 * This will allow for targeting the db by only including the host value
 * e.g. `migration.sh stg-clay.radio.com` instead of `PGHOST=localhost PG... ./migration.sh`
 * @param cb
 * @returns {Promise<void|any>}
 */
const v3 = async (env, cb) => {
  const { PGDATABASE, PGHOST, PGPASSWORD, PGUSER } = env;

  const pool = new Pool({
    user: PGUSER,
    host: PGHOST,
    password: PGPASSWORD,
    database: PGDATABASE
  });

  return cb(pool)
    .finally(() => {
      if (pool) {
        pool.end();
      }
    });
}

module.exports = {
  v1,
  v2,
  v3,
};
