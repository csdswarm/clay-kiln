'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({file: __filename}),
  NAME = 'valid-scripts',
  TABLE = NAME.replace('-', '_'),
  ENDPOINT = `/${NAME}`,
  KEY = `${process.env.CLAY_SITE_HOST}/_${TABLE}/items`,
  /**
   * Add routes for valid-scripts
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    const get = async () => {
      let data = await db.get(KEY, { });

      if (!data.items) {
        const items = [];

        await db.post(KEY, { items });
        data = { items };
      }

      return data;
    };

    db.ensureTableExists(TABLE);
    /**
     * Get the current valid-scripts for html-embeds
     */
    app.get(ENDPOINT, async (req, res) => {
      try {
        res.status(200).send(await get());
      } catch (e) {
        log('error', `Failed valid-scripts get ${e.message}`);
        res.status(500).send('There was an error getting current valid-scripts');
      }
    });

    /**
     * Add a new item
     */
    app.post(ENDPOINT, checkAuth, async (req, res) => {
      try {
        const data = await get();

        if (!data.items.includes(req.body.item)) {
          data.items.push(req.body.item);

          await db.put(KEY, data);
        }

        res.status(200).send(data);
      } catch (e) {
        log('error', `Failed valid-scripts post ${e.message}`);
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
        log('error', `Failed valid-scripts put ${e.message}`);
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
        log('error', `Failed valid-scripts del ${e.message}`);
        res.status(500).send('There was an error saving the item');
      }
    });
  };

module.exports.inject = inject;
