'use strict';

const db = require('amphora-storage-postgres'),
  { checkTableExists, createTable } = require('./db'),
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
   * Empty the environment variable table
   */
  truncateTable = async () => {
    if (await checkTableExists(TABLE_NAME)) {
      await db.raw(`
        TRUNCATE TABLE ${TABLE_NAME}
      `);
    }
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

  // Drop the table every time to ensure only the specific variables
  await truncateTable(TABLE_NAME);
  await createTable(TABLE_NAME, 'text');

  await Promise.all(Object.entries(variablesToStore).map(addEnvironmentVariable));
};
