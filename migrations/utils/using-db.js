'use strict';

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
 *
 * @param {function} cb - called with an instance of pg's Pool
 * @returns {*} - the result of cb
 */
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

module.exports = {
  v1,
  v2,
};
