'use strict';

const { _invoke } = require('../base');

/**
 * gracefully closes the cursor then releases the client - resolves the promise
 *   when it's done
 *
 * @param {object} cursor
 * @param {object} client
 * @returns {Promise}
 */
function closeAndRelease_v1(cursor, client) {
  return new Promise((resolve, reject) => {
    try {
      if (!cursor.close) {
        resolve()
      }

      cursor.close(err => {
        if (err) reject(err)
        else resolve()
      })
    } catch (err) {
      reject(err);
    } finally {
      _invoke(client, 'release')
    }
  });
}

/**
 * reads the number of rows from the cursor
 *
 * @param {Number} requestNumRows
 * @param {object} cursor
 * @returns {object[]}
 */
function read_v1(requestNumRows, cursor) {
  return new Promise((resolve, reject) => {
    try {
      cursor.read(requestNumRows, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      })
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  v1: {
    closeAndRelease: closeAndRelease_v1,
    read: read_v1
  }
}
