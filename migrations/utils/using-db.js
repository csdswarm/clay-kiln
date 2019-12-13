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

module.exports = { v1 };
