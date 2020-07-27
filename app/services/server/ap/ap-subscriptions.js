'use strict';

const db = require('../db'),
  uuidV4 = require('uuid/v4'),
  { getApFeed } = require('./ap-media'),
  { importArticle } = require('./ap-news-importer'),
  logger = require('../../universal/log'),
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
    importArticle,
    getApFeed,
    getAll,
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
        apSubscriptions = await __.getAll(),
        returnData = [];

      for (const feed of apFeed) {
        let apImportData = '{';

        feed.products.forEach(product => {
          apSubscriptions.forEach(subscription => {
            subscription.data.entitlements.forEach(entitlement => {
              if (product.id === entitlement.id) {
                if (!apImportData.includes(subscription.data.stationSlug)) {
                  apImportData += `"${subscription.data.stationSlug}" : ${JSON.stringify(subscription.data.mappings[0])},`;
                }
              }
            });
          });
        });

        if (apImportData.length > 1) {
          apImportData = apImportData.slice(0, -1) + '}';

          try {
            const data = await __.importArticle(feed.item, JSON.parse(apImportData), locals);

            returnData.push(data);
          } catch (error) {
            __.log('error', 'Bad request importing articles from ap-subscription', error);
          }

        }
      };

      return returnData;

    } catch (e) {
      __.log('error', 'Bad request importing articles from ap-subscription', e);
      return [];
    }
  };

module.exports = {
  _internals: __,
  ensureRecordExists,
  importApSubscription,
  getAll,
  save
};
