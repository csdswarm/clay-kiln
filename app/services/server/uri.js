'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({ file: __filename }),

  /**
   * Gets the row with the id of the canonical url
   *
   * @param {any} canonical
   *
   * @returns {Promise}
   */
  getCanonicalRedirect = async canonical => {
    try {
      const { rows } = await db.raw(`
      SELECT id FROM uris
      WHERE url = ?
      `, [canonical]);

      return rows;
    } catch (e) {
      log('error', `There was a problem finding a record for ${canonical}`, e);
    }
  },

  
  /**
   * Gets the list of available uri records
   *
   * @param {any} val
   *
   * @returns {Promise}
   */

  
  getUri = async val => {
    try {
      const { rows } = await db.raw(`
      SELECT * FROM uris
      WHERE data = ?
      `, [val]);

      return rows;
    } catch (e) {
      log('error', `There was a problem findind uri records for ${val}`, e);
      return false;
    }
  },

  /**
   * Update a row in a postgres table for a particular column
   *
   * @param {any} key
   * @param {any} keyToChange
   *
   * @returns {Promise}
   */
  setUri = async (key, keyToChange) => {
    try {
      return db.raw(`
        UPDATE uris
        SET data = ?
        WHERE url = ?
      `, [key, keyToChange]);
    } catch (e) {
      log('error', `There was a problem updating ${key}`, e);
    }
  };

module.exports = {
  getCanonicalRedirect,
  getUri,
  setUri
};
