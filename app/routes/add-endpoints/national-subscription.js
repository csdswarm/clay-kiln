'use strict';

const db = require('amphora-storage-postgres'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  createSubscription = async (req, res) => {
    const { shortDescription, stationSlug, filter } = req.body;

    try {
      const result = await db.raw(`
            INSERT INTO national_subscriptions
              (short_desc, station_slug, filter, last_updated_utc)
              VALUES (?, ?, ?, NOW())
              RETURNING *;
        `, [shortDescription, stationSlug, filter]);

      res.status(200).send(result.rows[0]);
    } catch (e) {
      log('error', e.message);
      res.status(500).send('There was an error updating this subscription');
    }
  },
  deleteSubscription = async (req, res) => {
    const { id } = req.params;

    try {
      await db.raw(`
            DELETE FROM national_subscriptions
            WHERE id = ?
        `, [id]);

      res.status(200).send(`Subscription ${id} deleted.`);
    } catch (e) {
      log('error', e.message);
      res.status(500).send(`There was an error deleting subscription ${id}`);
    }
  },
  upsertSubscription = async (req, res) => {
    const id = req.params.id,
      { shortDescription, stationSlug, filter } = req.body;

    try {
      const result = await db.raw(`
            UPDATE national_subscriptions
              SET short_desc = ?, station_slug = ?, filter = ?, last_updated_utc = NOW()
              WHERE id = ?
              RETURNING *
        `, [shortDescription, stationSlug, filter, id]);

      res.status(200).send(result.rows[0]);
    } catch (e) {
      log('error', e.message);
      res.status(500).send('There was an error creating this subscription');
    }
  };

module.exports = router => {
  router.post('/rdc/national-subscription', createSubscription);
  router.put('/rdc/national-subscription/:id', upsertSubscription);
  router.delete('/rdc/national-subscription/:id', deleteSubscription);
};
