'use strict';

const db = require('../../services/server/db');

module.exports = async () => {
  const { rows } = await db.raw(`
    SELECT id, data
    FROM editorial_group
  `);

  return rows;
};
