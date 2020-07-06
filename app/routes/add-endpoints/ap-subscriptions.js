'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  { ensureRecordExists, getAll, save } = require('../../services/server/ap/ap-subscriptions');

/**
 * Add routes for ap-subscriptions
 * @param {object} router
 */
module.exports = router => {
  /**
   * Get all ap-subscriptions
   */
  router.get('/ap-subscriptions', async (req, res) => {
    try {
      const data = await getAll();

      return res.status(200).send(data);
    } catch (e) {
      log('error', e.message);
      return res.status(500).send('There was an error getting the subscriptions.');
    }
  });
  /**
   * Get a record with a given Id
   */
  router.get('/ap-subscriptions/:id', async (req, res) => {
    const { id } = req.params,
      key = `${CLAY_SITE_HOST}/_ap_subscriptions/${id}`;

    try {
      const data = await db.get(key);

      return res.status(200).send(data);
    } catch (e) {
      log('error', e);
      return res.status(500).send('There was an error getting current subscription.');
    }
  });
  /**
   * Add a new ap-subscription
   */
  router.post('/ap-subscriptions', async (req, res) => {
    const subscription = req.body;

    try {
      const key  = await save(null, subscription);

      return res.status(201).send({ id: key, data: subscription });
    } catch (e) {
      log('error', e.message);
      return res.status(400).send('There was an error saving the supscription');
    }
  });
  /**
   * Update an ap-subscription
   */

  router.put('/ap-subscriptions/:id', async (req, res) => {
    const { id } = req.params,
      { ...subscription } = req.body,
      key = `${CLAY_SITE_HOST}/_ap_subscriptions/${id}`;
    
    if (!await ensureRecordExists(key)) {
      return res.status(400).send({ message: `No record was found for id ${id}` });
    }
    try {
      await save(key, subscription);
      return res.status(200).send({ key: id, subscription });
    } catch (e) {
      log('error', e.message);
      return res.status(400).send('There was an error saving the supscription');
    }
  });
  /**
  * Deletes an ap-subscription
  */
  router.delete('/ap-subscriptions/:id', async (req, res) => {
    const { id } = req.params,
      key = `${CLAY_SITE_HOST}/_ap_subscriptions/${id}`;

    if (!await ensureRecordExists(key)) {
      return res.status(400).send({ message: `No record was found for id ${id}` });
    }
    try {
      await db.del(key);
      return res.status(200).send({ message: `The record associated to id ${id} has been removed.` });
    } catch (e) {
      log('error', e.message);
      return res.status(500).send('There was an error removing the subscription');
    }
  });
};
