'use strict';

const { pgCursor } = require('../base'),
  { closeAndRelease } = require('./utils').v1;

/**
 * Provides a 'using' interface for pg-cursor
 *
 * @param {object} pgCursorArgs
 * @param {function} cb
 *
 * @returns {*} - the result of cb
 */
const v1 = ({ db, pgCursorArgs }, cb) => {
  return new Promise(async (resolve, reject) => {
    let client,
      cursor,
      result,
      hasErr = false;

    try {
      // from https://node-postgres.com/api/cursor
      client = await db.connect();
      cursor = client.query(new pgCursor(...pgCursorArgs));

      result = await cb(cursor);
    } catch (err) {
      hasErr = true;
      reject(err);
    } finally {
      await closeAndRelease(cursor, client);

      if (!hasErr) {
        resolve(result);
      }
    }
  });
};

module.exports = { v1 };
