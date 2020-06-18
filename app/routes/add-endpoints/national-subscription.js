'use strict';

const db = require('amphora-storage-postgres'),
  redis = require('../../services/server/redis'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  clearRedisCache = () => redis.del('national-subscriptions'),
  createSubscription = async (req, res) => {
    const { shortDescription, fromStationSlug, stationSlug, filter } = req.body;

    try {
      const result = await db.raw(`
            INSERT INTO national_subscriptions
              (short_desc, from_station_slug, station_slug, filter, last_updated_utc)
              VALUES (?, ?, ?, ?, NOW())
              RETURNING *;
        `, [shortDescription, fromStationSlug, stationSlug, filter]);

      res.status(200).send(result.rows[0]);
      clearRedisCache();
    } catch (e) {
      log('error', e.message);
      res.status(500).send('There was an error creating this subscription');
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
      clearRedisCache();
    } catch (e) {
      log('error', e.message);
      res.status(500).send(`There was an error deleting subscription ${id}`);
    }
  },
  updateSubscription = async (req, res) => {
    const id = req.params.id,
      { shortDescription, fromStationSlug, stationSlug, filter } = req.body;

    try {
      const result = await db.raw(`
            UPDATE national_subscriptions
              SET short_desc = ?, from_station_slug = ?, station_slug = ?, filter = ?, last_updated_utc = NOW()
              WHERE id = ?
              RETURNING *
        `, [shortDescription, fromStationSlug, stationSlug, filter, id]);

      res.status(200).send(result.rows[0]);
      clearRedisCache();
    } catch (e) {
      log('error', e.message);
      res.status(500).send('There was an error updating this subscription');
    }
  };

module.exports = router => {
  router.post('/rdc/national-subscription', createSubscription);
  router.put('/rdc/national-subscription/:id', updateSubscription);
  router.delete('/rdc/national-subscription/:id', deleteSubscription);
};
