'use strict';

const db = require('amphora-storage-postgres'),
  redis = require('./redis');

// we need oldRedisKey for blue-green compatibility.  Once content-subscriptions
//   is fully rolled out, we can remove this.
const oldRedisKey = 'national-subscriptions',
  redisKey = 'content-subscriptions',

  /**
   * @typedef ContentSubscription
   * @property id {number}
   * @property short_desc {string}
   * @property station_slug {string}
   * @property last_updated_utc {date}
   * @property filter {object}
   * @property from_station_slug {string}
   *
   * the filter object's schema should be in sync with recirculation.js'
   *   properties, but at the moment its properties are
   *
   * {
   *   populateFrom {string}
   *   contentType {string[]}
   *   sectionFront {string}
   *   secondarySectionFront {string}
   *   tags {string[]}
   *   excludeSectionFronts {string[]}
   *   excludeSecondarySectionFronts {string[]}
   *   excludeTags {string[]}
   * }
   */

  /**
   * returns all rows from public.content_subscriptions sorted by
   *   last_updated_utc descending
   *
   * @param {bool} shouldOrder
   * @returns {ContentSubscription[]}
   */
  getContentSubscriptions = async ({ shouldOrder = true } = {}) => {
    try {
      let subscriptions = await redis.get(redisKey);

      if (!subscriptions) {
        const orderClause = shouldOrder
          ? 'order by last_updated_utc asc'
          : '';

        subscriptions = (
          await db.raw(`
            select *
            from content_subscriptions
            ${orderClause}
          `)
        ).rows;

        const redisVal = JSON.stringify(subscriptions);

        await Promise.all([
          redis.set(oldRedisKey, redisVal),
          redis.set(redisKey, redisVal)
        ]);
      } else {
        subscriptions = JSON.parse(subscriptions)
          .map(sub => {
            sub.last_updated_utc = new Date(sub.last_updated_utc);

            return sub;
          });
      }

      return subscriptions;
    } catch (err) {
      // without this, make bootstrap fails locally on a lot of content-related
      //   operations since 'content_subscriptions' doesn't exist yet
      if (
        process.env.NODE_ENV === 'local'
        && err.message.includes('relation "content_subscriptions" does not exist')
      ) {
        return [];
      }

      throw err;
    }
  };

/**
 * a convenience method exposing the subscriptions by slug
 *
 * note: alternatively we could fetch from the database and filter there to
 *   prevent loading all the subscriptions into memory for this use-case.
 *   However I think using the cache to avoid a db call is the better decision
 *   for now until memory becomes an issue, which I don't foresee happening as
 *   a result of these subscriptions.
 *
 * @param {string} slug
 * @returns {ContentSubscription[]}
 */
getContentSubscriptions.byStationSlug = async slug => {
  return (await getContentSubscriptions())
    .filter(sub => sub.station_slug === slug);
};

Object.assign(getContentSubscriptions, {
  oldRedisKey,
  redisKey
});

module.exports = getContentSubscriptions;
