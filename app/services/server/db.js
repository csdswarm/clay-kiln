'use strict';

const utils = require('../universal/utils'),
  log = require('../universal/log').setup({ file: __filename }),
  db = require('amphora-storage-postgres'),
  _get = require('lodash/get'),
  DATA_STRUCTURES = [
    'alert', 'ap_subscriptions', 'apple_news', 'editorial_group', 'station_themes', 'valid_source'
  ],
  /**
   * Check Postgres to see if the table exists
   *
   * @param {string} tableName
   * @returns {boolean}
   */
  checkTableExists = async (tableName) => {
    const { rows: [{ exists }] } = await db.raw(`
      SELECT EXISTS(
        SELECT *
        FROM information_schema.tables
        WHERE table_name = ?
      )
    `, [tableName]);

    return exists;
  },
  /**
   * Create table in Postgres if it doesn't exist
   *
   * @param {string} tableName
   * @param {string} dataType
   * @returns {Promise}
   */
  createTable = async (tableName, dataType = 'jsonb') => {
    if (!await checkTableExists(tableName)) {
      try {
        await db.raw(`
          CREATE TABLE ${tableName} (
            id text PRIMARY KEY,
            data ${dataType}
          )
        `);
      } catch (e) {
        log('error', `There was a problem creating a table for ${tableName}`, e);
        return false;
      }
    }
    return Promise.resolve(true);
  },
  /**
   * Cache created by checking if tables exist
   */
  tablesCreated = {},
  /**
   * Ensures table exists by checking cache, and tries to create if table does not exist and is an allowed table
   *
   * @param {string} tableName
   */
  ensureTableExists = async (tableName) => {
    if (!tablesCreated[tableName] && DATA_STRUCTURES.includes(tableName)) {
      tablesCreated[tableName] = await createTable(tableName);
    }
  },
  /**
   * Checks key and DATA_STRUCTURES for a valid table name
   *
   * @param {string} key
   * @returns {string} tableName
   */
  findSchemaAndTable = (key) => {
    var tableName;

    DATA_STRUCTURES.forEach(DATA_TYPE => {
      if (key.includes(`_${DATA_TYPE}`)) {
        tableName = DATA_TYPE;
      }
    });

    return tableName;
  },
  /**
   * Removes a row in a postgres table
   * If the table is not in DATA_STRUCTURES, the call is passed to the amphora-storage-postgres instance
   *
   * @param {string} key
   *
   * @returns {Promise}
   */
  del = async (key) => {
    const tableName = findSchemaAndTable(key);

    if (!tableName) {
      return db.del(key);
    } else {
      await ensureTableExists(tableName);
      return db.raw(`
        DELETE FROM ${tableName}
        WHERE id = ?
      `, [key]);
    }
  },
  /**
   * Gets a row in a postgres table
   * If the table is not in DATA_STRUCTURES, the call is passed to the amphora-storage-postgres instance
   *
   * @param {string} key
   * @param {object} [_locals] - unused, only here for api compatibility with client/db.js
   * @param {any} [defaultValue]
   *
   * @returns {Promise}
   */
  get = async (key, _locals, defaultValue) => {
    const tableName = findSchemaAndTable(key);

    if (!tableName) {
      return db.get(key);
    } else {
      await ensureTableExists(tableName);
      return db.raw(`
        SELECT data FROM ${tableName}
        WHERE id = ?
      `, [key])
        .then(({ rows }) => {
          if (!rows.length) {
            return defaultValue || Promise.reject(new Error(`No result found in ${ tableName } for ${ key }`));
          }
          return rows[0].data;
        });
    }
  },
  /**
   * Insert a row in a postgres table
   * If the table is not in DATA_STRUCTURES, the call is passed to the amphora-storage-postgres instance
   *
   * @param {string} key
   * @param {any} value
   *
   * @returns {Promise}
   */
  post = async (key, value) => {
    const tableName = findSchemaAndTable(key);

    if (!tableName) {
      return db.put(key, value);
    } else {
      await ensureTableExists(tableName);
      return db.raw(`
        INSERT INTO ${tableName} (id, data)
        VALUES (?, ?)
      `, [key, value]);
    }
  },
  /**
   * Update a row in a postgres table
   * If the table is not in DATA_STRUCTURES, the call is passed to the amphora-storage-postgres instance
   *
   * @param {string} key
   * @param {any} value
   *
   * @returns {Promise}
   */
  put = async (key, value) => {
    const tableName = findSchemaAndTable(key);

    if (!tableName) {
      return db.put(key, value);
    } else {
      await ensureTableExists(tableName);
      return db.raw(`
        UPDATE ${tableName}
        SET data = ?
        WHERE id = ?
      `, [value, key]);
    }
  },
  /**
   * retrieves the data from the uri
   *
   * @param {string} uri
   * @param {string} [key]
   *
   * @return {object}
   */
  getComponentData = async (uri, key) => {
    const data = await db.get(uri.split('@')[0]) || {};

    return key ? _get(data, key) : data;
  };

module.exports = {
  getUri: uri => db.get(uri),
  del,
  get,
  post,
  put,
  raw: db.raw,
  uriToUrl: utils.uriToUrl,
  checkTableExists,
  createTable,
  ensureTableExists,
  DATA_STRUCTURES,
  getComponentData
};
