'use strict';

const db = require('./db'),
  { preventFastlyCache } = require('../startup/middleware-utils'),
  log = require('../universal/log').setup({ file: __filename }),
  NAME = 'valid-source',
  TABLE = NAME.replace('-', '_'),
  ENDPOINT = `/${NAME}`,
  KEY = `${process.env.CLAY_SITE_HOST}/_${TABLE}/items`,
  /**
   * Add routes for valid-source
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    const get = async () => {
      let data = await db.get(KEY, null, { });

      if (!data.items) {
        const items = [];

        await db.post(KEY, { items });
        data = { items };
      }

      return data;
    };

    db.ensureTableExists(TABLE);
    /**
     * Get the current valid-source for html-embeds
     */
    app.get(ENDPOINT, async (req, res) => {
      preventFastlyCache(res);

      try {
        res.status(200).send(await get());
      } catch (e) {
        log('error', 'Failed valid-source get', e);
        res.status(500).send('There was an error getting current valid-source');
      }
    });

    /**
     * Add a new item
     */
    app.post(ENDPOINT, checkAuth, async (req, res) => {
      try {
        const data = await get();

        if (!data.items.includes(req.body.item)) {
          data.items.unshift(req.body.item);

          await db.put(KEY, data);
        }

        res.status(200).send(data);
      } catch (e) {
        log('error', `Failed valid-source post ${e.message}`);
        res.status(500).send('There was an error saving the item');
      }
    });

    /**
     * Update an item
     */
    app.put(ENDPOINT, checkAuth, async (req, res) => {
      try {
        const data = await get();

        if (data.items.includes(req.body.old) && !data.items.includes(req.body.new)) {
          data.items = data.items.map(item => item === req.body.old ? req.body.new : item);

          await db.put(KEY, data);
        }

        res.status(200).send(data);
      } catch (e) {
        log('error', 'Failed valid-source put', e);
        res.status(500).send('There was an error saving the item');
      }
    });

    /**
     * Delete an item
     */
    app.delete(ENDPOINT, checkAuth, async (req, res) => {
      try {
        const data = await get();

        if (data.items.includes(req.body.item)) {
          data.items = data.items.filter(item => item !== req.body.item);

          await db.put(KEY, data);
        }

        res.status(200).send(data);
      } catch (e) {
        log('error', 'Failed valid-source del', e);
        res.status(500).send('There was an error saving the item');
      }
    });
  };

module.exports.inject = inject;
