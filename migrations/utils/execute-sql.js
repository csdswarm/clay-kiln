const usingDb = require('./using-db');
const { v1: { getFileText } } = require('./read-file');

/**
 * Handles running sql against postgres
 * @param {string} sql the sql to execute
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQL_v1(sql, ...args) {
  let rows;

  try {
    await usingDb.v1(async db =>
      rows = (await db.query(sql, args)).rows
    );
    return rows || [];
  } catch (error) {
    console.error('There was an error while executing SQL.\n\n', { error, path, args });
  }
}

/**
 * Handles retrieving a sql file and running it against postgres immediately
 * @param {string} path path to .sql file
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQLFile_v1(path, ...args) {
  return executeSQL_v1(await getFileText(path), ...args);
}

/**
 * Similar to executeSQL, handles running a SQL query, however, it runs it in a transaction and
 * will rollback any changes if an error occurs during the transaction.
 * if the query returns any data, so will this
 * @param {string} path path to .sql file
 * @param {*} args optional arguments to be passed to the sql which will replace any `?` in the
 *   script with the appropriate data, in the order set.
 * @returns {Promise<object[]>} The data (if any) that was returned from the query
 */
async function executeSQLFileTrans_v1(path, ...args) {
  let rows;

  await usingDb.v1(async db => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      rows = (await client.query(await getFileText(path), args)).rows;
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(
        'There was an error while executing SQL.\nTransaction Was Rolled Back.\n\n',
        { error, path, args });
    } finally {
      client.release();
    }
  });

  return rows || [];
}

module.exports = {
  v1: {
    executeSQL: executeSQL_v1,
    executeSQLFile: executeSQLFile_v1,
    executeSQLFileTrans: executeSQLFileTrans_v1
  }
}
