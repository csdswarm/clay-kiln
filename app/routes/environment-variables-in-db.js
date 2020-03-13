'use strict';

const db = require('amphora-storage-postgres'),
  { createTable } = require('../services/server/db'),
  TABLE_NAME = 'environment_variables',
  { BRIGHTCOVE_ACCOUNT_ID } = process.env,
  /**
   * Adds an environment variable to postgres
   *
   * @param {array} values - should be a [key,value] array
   */
  addEnvironmentVariable = async values => {
    await db.raw(`
        INSERT INTO ${TABLE_NAME} (id, data)
        VALUES (?, ?)
    `, values);
  },
  /**
   * Drops the environment variable table
   */
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

  // Drop the table every time to ensure only the specific variables are available
  await dropTable(TABLE_NAME);
  await createTable(TABLE_NAME, 'text');

  await Promise.all(Object.entries(variablesToStore).map(addEnvironmentVariable));
};
