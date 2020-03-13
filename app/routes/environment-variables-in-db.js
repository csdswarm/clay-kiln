'use strict';

const db = require('amphora-storage-postgres'),
  { createTable } = require('../services/server/db'),
  TABLE_NAME = 'environment_variables',
  { BRIGHTCOVE_ACCOUNT_ID } = process.env,
  addEnvironmentVariable = async values => {
    await db.raw(`
        INSERT INTO ${TABLE_NAME} (id, data)
        VALUES (?, ?)
    `, values);
  },
  dropTable = async () => {
    await db.raw(`
        DROP TABLE IF EXISTS ${TABLE_NAME}
    `);
  };

module.exports = async () => {
  const variablesToStore = {
      BRIGHTCOVE_ACCOUNT_ID,
      BRIGHTCOVE_PLAYER_ID: '9klBjvbUGf'
    },
    missingVariables = Object.keys(variablesToStore)
      .filter(key => !variablesToStore[key]);

  if (missingVariables.length) {
    throw new Error(`${missingVariables.join(',')} are required variables`);
  }

  await dropTable(TABLE_NAME);
  await createTable(TABLE_NAME, 'text');

  await Promise.all(Object.entries(variablesToStore).map(addEnvironmentVariable));
};
