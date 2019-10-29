'use strict';

const utils = require('../universal/utils'),
  log = require('../universal/log').setup({ file: __filename }),
  db = require('amphora-storage-postgres'),
  _get = require('lodash/get'),
  DATA_STRUCTURES = ['alert'],
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
   * @returns {Promise}
   */
  createTable = async (tableName) => {
    if (!await checkTableExists(tableName)) {
      try {
        await db.raw(`
          CREATE TABLE ${tableName} (
            id text PRIMARY KEY,
            data jsonb
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
      if (key.indexOf(`/_${DATA_TYPE}`) > -1) {
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
   *
   * @returns {Promise}
   */
  get = async (key, ...args) => {
    const tableName = findSchemaAndTable(key);

    if (!tableName) {
      return db.get(key, ...args);
    } else {
      await ensureTableExists(tableName);
      return db.raw(`
        SELECT data FROM ${tableName}
        WHERE id = ?
      `, [key])
        .then(({ rows }) => {
          if (!rows.length) return Promise.reject(`No result found in ${tableName} for ${key}`);

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
  },
  /**
   * Takes a URI (even if it is not a `/_pages/` uri), finds the target page
   * and returns a list of component ids that belong to its `main` section as an array
   * @param {string} uri
   * @returns {Promise<string[]>}
   */
  getMainComponentsForPageUri = async (uri) => {
    const
      firstMatchingUrl = `
        SELECT id, url, data
        FROM public.uris u
        WHERE ? IN (u.url /* if it's a slug url */, u.data /* if a /_pages/ url */)
      `,
      recursiveMatches = `
        SELECT u2.id, u2.url, u2.data
        FROM _uris _u
          INNER JOIN public.uris u2 ON _u.data = u2.id
      `,
      mainComponentsList = `
        SELECT
          main
        FROM
          _uris _u
          INNER JOIN public.pages p
            ON _u.data = p.id
          , jsonb_array_elements_text(p.data->'main') main
        WHERE _u.data ~ '/_pages/'
      `,
      sql = `
          WITH RECURSIVE _uris AS (
              ${firstMatchingUrl}
            UNION ALL
              ${recursiveMatches}
          )
          ${mainComponentsList};`,
      data = await db.raw(sql, [uri]);

    return data.rows && data.rows.map(row => row.main) || [];
  };

module.exports.getUri = uri => db.get(uri);
module.exports.del = del;
module.exports.get = get;
module.exports.post = post;
module.exports.put = put;
module.exports.raw = db.raw;
module.exports.uriToUrl = utils.uriToUrl;
module.exports.ensureTableExists = ensureTableExists;
module.exports.getMainComponentsForPageUri = getMainComponentsForPageUri;
module.exports.DATA_STRUCTURES = DATA_STRUCTURES;
module.exports.getComponentData = getComponentData;
