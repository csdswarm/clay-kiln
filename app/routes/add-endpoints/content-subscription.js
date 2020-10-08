'use strict';

const db = require('amphora-storage-postgres'),
  redis = require('../../services/server/redis'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  {
    oldRedisKey,
    redisKey
  } = require('../../services/server/get-content-subscriptions'),
  clearRedisCache = () => Promise.all([
    redis.del(oldRedisKey),
    redis.del(redisKey)
  ]),
  createSubscription = async (req, res) => {
    const { shortDescription, fromStationSlug, stationSlug, filter, mapped_section_fronts } = req.body;

    try {
      const result = await db.raw(`
            INSERT INTO content_subscriptions
              (short_desc, from_station_slug, station_slug, filter, mapped_section_fronts, last_updated_utc)
              VALUES (?, ?, ?, ?, ?, NOW())
              RETURNING *;
        `, [shortDescription, fromStationSlug, stationSlug, filter, mapped_section_fronts]);

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
            DELETE FROM content_subscriptions
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
      { shortDescription, fromStationSlug, stationSlug, filter, mapped_section_fronts } = req.body;

    try {
      const result = await db.raw(`
            UPDATE content_subscriptions
              SET short_desc = ?, from_station_slug = ?, station_slug = ?, filter = ?, mapped_section_fronts = ?, last_updated_utc = NOW()
              WHERE id = ?
              RETURNING *
        `, [shortDescription, fromStationSlug, stationSlug, filter, mapped_section_fronts, id]);

      res.status(200).send(result.rows[0]);
      clearRedisCache();
    } catch (e) {
      log('error', e.message);
      res.status(500).send('There was an error updating this subscription');
    }
  };

module.exports = router => {
  router.post('/rdc/content-subscription', createSubscription);
  router.put('/rdc/content-subscription/:id', updateSubscription);
  router.delete('/rdc/content-subscription/:id', deleteSubscription);
};
