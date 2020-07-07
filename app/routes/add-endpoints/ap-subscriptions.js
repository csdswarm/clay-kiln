'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  { ensureRecordExists, getAll, save } = require('../../services/server/ap/ap-subscriptions'),
  __ = {
    dbGet: db.get,
    dbDel: db.del,
    ensureRecordExists,
    getAll,
    save
  },
  /**
   * Add routes for ap-subscriptions
   * @param {object} router
   */
  apSubscriptions  = router => {
    /**
     * Get all ap-subscriptions
     */
    router.get('/rdc/ap-subscriptions', async (req, res) => {
      try {
        const data = await __.getAll();

        return res.status(200).send(data);
      } catch (e) {
        log('error', e.message);
        return res.status(500).send('There was an error getting the subscriptions.');
      }
    });
    /**
     * Get a record with a given Id
     */
    router.get('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const data = await __.dbGet(id);

        return res.status(200).send(data);
      } catch (e) {
        log('error', e);
        return res.status(500).send('There was an error getting current subscription.');
      }
    });
    /**
     * Add a new ap-subscription
     */
    router.post('/rdc/ap-subscriptions', async (req, res) => {
      const subscription = req.body;

      try {
        const key  = await __.save(null, subscription);

        return res.status(201).send({ id: key, data: subscription });
      } catch (e) {
        log('error', e.message);
        return res.status(400).send('There was an error saving the supscription');
      }
    });
    /**
     * Update an ap-subscription
     */

    router.put('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params,
        { ...subscription } = req.body;
      
      if (!await __.ensureRecordExists(id)) {
        return res.status(400).send({ message: `No record was found for id ${id}` });
      }
      try {
        await __.save(id, subscription);
        return res.status(200).send({ key: id, subscription });
      } catch (e) {
        log('error', e.message);
        return res.status(400).send('There was an error saving the supscription');
      }
    });
    /**
    * Deletes an ap-subscription
    */
    router.delete('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params;

      if (!await __.ensureRecordExists(id)) {
        return res.status(400).send({ message: `No record was found for id ${id}` });
      }
      try {
        await __.dbDel(id);
        return res.status(200).send({ message: `The record associated to id ${id} has been removed.` });
      } catch (e) {
        log('error', e.message);
        return res.status(500).send('There was an error removing the subscription');
      }
    });
  };

apSubscriptions._internals = __;

module.exports = apSubscriptions;
