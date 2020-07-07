'use strict';

const db = require('../db'),
  uuidV4 = require('uuid/v4'),
  __ = {
    dbPost: db.post,
    dbPut: db.put
  },
  /**
   * Get a record matching a given id
   *
   * @param {any} key
   */
  ensureRecordExists = async key => {
    const { rows } = await db.raw(`
    SELECT data FROM ap_subscriptions
    WHERE id = ?
  `,[key]);

    return rows.length > 0;
  },
  /**
   * Returns all records in ap_subscriptions
   */
  getAll = async () => {
    const  { rows } = await db.raw(`
      SELECT * FROM ap_subscriptions;
    `);

    return rows;
  },
  /**
   * saves an individual subscription. if an id is provided,
   * it will update it. if no id is given, it will generate one and return what was generated.
   * @param {any} id
   * @param {Object} subscription
   */
  save = async (id = '', subscription = {}) => {
    if (id) {
      return await __.dbPut(id, subscription);
    } else {
      const id = uuidV4(),
        key = `_ap_subscriptions${id}`;

      await __.dbPost(key, subscription);
      return key;
    };
  };

module.exports = {
  _internals: __,
  ensureRecordExists,
  getAll,
  save
};
