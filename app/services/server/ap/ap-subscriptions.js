'use strict';

const
  _intersectionBy = require('lodash/intersectionBy'),
  { getApFeed } = require('./ap-media'),
  { importArticle } = require('./ap-news-importer'),
  db = require('../db'),
  logger = require('../../universal/log'),
  Promise = require('bluebird'),
  uuidV4 = require('uuid/v4'),
  log = logger.setup({ file: __filename }),

  /**
   * Returns all records in ap_subscriptions
   */
  getAll = async () => {
    const  { rows } = await db.raw(`
      SELECT * FROM ap_subscriptions;
    `);

    return rows;
  },
  __ = {
    dbPost: db.post,
    dbPut: db.put,
    getApFeed,
    getAll,
    importArticle,
    log
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
  },

  /**
   * Import an articles from the AP Subscription
   * @param {object} locals
   * @return {array}
   */
  importApSubscription = async (locals) => {
    try {
      const apFeed = await __.getApFeed(locals),
        apSubscriptions = await __.getAll();

      return Promise.map(apFeed, feed => {
        const stationMappings = apSubscriptions
          .filter(({ data }) => _intersectionBy(data.entitlements, feed.products, 'id').length)
          .reduce((acc, { data }) => {
            if (!acc[data.stationSlug]) {
              acc[data.stationSlug] = data.mappings;
            }
            return acc;
          }, {});

        __.importArticle(feed.item, stationMappings, locals);
        
        return `${feed.item.uri}&include=*`;
      }, { concurrency: 5 });

    } catch (e) {
      __.log('error', 'Bad request importing articles from ap-subscription', e);
      return [];
    }
  };

module.exports = {
  _internals: __,
  ensureRecordExists,
  getAll,
  importApSubscription,
  save
};
