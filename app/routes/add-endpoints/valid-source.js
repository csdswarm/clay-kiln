'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  { preventFastlyCache } = require('../../services/startup/middleware-utils'),
  { unityAppDomainName: unityApp } = require('../../services/universal/urps');

const NAME = 'valid-source',
  ENDPOINT = `/${NAME}`,
  TABLE = NAME.replace('-', '_'),
  KEY = `${process.env.CLAY_SITE_HOST}/_${TABLE}/items`;

/**
 * middleware that ensures the user has permissions to update this resource
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
function ensurePermissions(req, res, next) {
  const hasPermissions = res.locals.user.can('update').a('valid-script-source').for(unityApp).value;

  if (!hasPermissions) {
    res.status(403).send('You do not have permissions to update the valid script sources');
    return;
  }

  next();
}

/**
 * Add routes for valid-source
 *
 * @param {object} router - an express router
 */
module.exports = router => {
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
  router.get(ENDPOINT, async (req, res) => {
    try {
      preventFastlyCache(res);
      res.send(await get());
    } catch (e) {
      log('error', 'Failed valid-source get', e);
      res.status(500).send('There was an error getting current valid-source');
    }
  });

  /**
   * Add a new item
   */
  router.post(ENDPOINT, ensurePermissions, async (req, res) => {
    try {
      const data = await get();

      if (!data.items.includes(req.body.item)) {
        data.items.unshift(req.body.item);

        await db.put(KEY, data);
      }

      res.send(data);
    } catch (e) {
      log('error', `Failed valid-source post ${e.stack}`);
      res.status(500).send('There was an error saving the item');
    }
  });

  /**
   * Update an item
   */
  router.put(ENDPOINT, ensurePermissions, async (req, res) => {
    try {
      const data = await get();

      if (data.items.includes(req.body.old) && !data.items.includes(req.body.new)) {
        data.items = data.items.map(item => item === req.body.old ? req.body.new : item);

        await db.put(KEY, data);
      }

      res.send(data);
    } catch (e) {
      log('error', 'Failed valid-source put', e);
      res.status(500).send('There was an error saving the item');
    }
  });

  /**
   * Delete an item
   */
  router.delete(ENDPOINT, ensurePermissions, async (req, res) => {
    try {
      const data = await get();

      if (data.items.includes(req.body.item)) {
        data.items = data.items.filter(item => item !== req.body.item);

        await db.put(KEY, data);
      }

      res.send(data);
    } catch (e) {
      log('error', 'Failed valid-source del', e);
      res.status(500).send('There was an error saving the item');
    }
  });
};
