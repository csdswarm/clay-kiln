'use strict';

const db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  { ensureRecordExists, getAll, importApSubscription, save } = require('../../services/server/ap/ap-subscriptions'),
  { STATUS_CODE } = require('../../services/universal/constants'),
  { searchAp } = require('../../services/server/ap/ap-media'),
  { importArticle } = require('../../services/server/ap/ap-news-importer'),
  { wrapInTryCatch } = require('../../services/startup/middleware-utils'),
  __ = {
    dbGet: db.get,
    dbDel: db.del,
    ensureRecordExists,
    getAll,
    importApSubscription,
    importArticle,
    log,
    save,
    searchAp,
    wrapInTryCatch
  },
  /**
   * Add routes for ap-subscriptions
   * @param {object} router
   */
  apSubscriptions  = router => {
    /**
    * Search for ap media information
    */
    router.get('/rdc/ap-subscriptions/search', __.wrapInTryCatch(async (req, res) => {
      const { q } = req.query;

      if (!q) {
        res.status(400).send("query param 'q' is required");
        return;
      }
      res.send(await __.searchAp(q));
    }));

    /**
    * Create a new article from ap media information
    */
    router.post('/rdc/ap-subscriptions/manual-import', __.wrapInTryCatch(async (req, res) => {
      const { apMeta, stationMappings, locals } = req.body;

      if (!apMeta || !stationMappings) {
        res.status(400).send('apMedia and stationMappings are required');
        return;
      }

      res.send(await __.importArticle(apMeta, stationMappings, locals));
    }));

    /**
     * Get all ap-subscriptions
     */

    router.get('/rdc/ap-subscriptions', async (req, res) => {
      try {
        const data = await __.getAll();
        
        return res.status(STATUS_CODE.OK).send(data);
      } catch (e) {
        log('error', e.message);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error getting the subscriptions.' });
      }
    });
    /**
     * Get a record with a given Id
     */
    router.get('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const data = await __.dbGet(id);

        return res.status(STATUS_CODE.OK).send(data);
      } catch (e) {
        __.log('error', e);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error getting current subscription.' });
      }
    });
    /**
     * Add a new ap-subscription
     */
    router.post('/rdc/ap-subscriptions', async (req, res) => {
      const subscription = req.body;

      try {
        const key  = await __.save(null, subscription);

        return res.status(STATUS_CODE.CREATED).send({ id: key, data: subscription });
      } catch (e) {
        __.log('error', e.message);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error saving the supscription' });
      }
    });
    /**
     * Update an ap-subscription
     */

    router.put('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params,
        { ...subscription } = req.body;
      
      if (!await __.ensureRecordExists(id)) {
        return res.status(STATUS_CODE.BAD_REQUEST).send({ message: `No record was found for id ${id}` });
      }
      try {
        await __.save(id, subscription);
        return res.status(STATUS_CODE.OK).send({ key: id, subscription });
      } catch (e) {
        __.log('error', e.message);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error saving the supscription' });
      }
    });
    /**
    * Deletes an ap-subscription
    */
    router.delete('/rdc/ap-subscriptions/:id', async (req, res) => {
      const { id } = req.params;

      if (!await __.ensureRecordExists(id)) {
        return res.status(STATUS_CODE.BAD_REQUEST).send({ message: `No record was found for id ${id}` });
      }
      try {
        await __.dbDel(id);
        return res.status(STATUS_CODE.OK).send({ message: `The record associated to id ${id} has been removed.` });
      } catch (e) {
        __.log('error', e.message);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error removing the subscription' });
      }
    });
    /**
    * Import ap-subscription
    */
    router.post('/rdc/ap-subscriptions/import', async (req, res) => {
      try {
        const data = await __.importApSubscription(res.locals);

        return res.status(STATUS_CODE.CREATED).send(data);
      } catch (e) {
        __.log('error', e.message);
        return res.status(STATUS_CODE.SERVER_ERROR).send({ message: 'There was an error importing the subscriptions' });
      }
    });
  };

apSubscriptions._internals = __;

module.exports = apSubscriptions;