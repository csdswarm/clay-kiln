'use strict';

const db = require('amphora-storage-postgres'),
  redis = require('./redis');

const redisKey = 'national-subscriptions',

  /**
   * @typedef NationalSubscription
   * @property id {number}
   * @property short_desc {string}
   * @property station_slug {string}
   * @property last_updated_utc {date}
   * @property filter {object}
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
   * returns all rows from public.national_subscriptions sorted by
   *   last_updated_utc descending
   *
   * @returns {NationalSubscription[]}
   */
  getNationalSubscriptions = async () => {
    let subscriptions = await redis.get(redisKey);

    if (!subscriptions) {
      subscriptions = (
        await db.raw(`
          select *
          from national_subscriptions
          order by last_updated_utc asc
        `)
      ).rows;

      await redis.set(redisKey, JSON.stringify(subscriptions));
    } else {
      subscriptions = JSON.parse(subscriptions)
        .map(sub => {
          sub.last_updated_utc = new Date(sub.last_updated_utc);

          return sub;
        });
    }

    return subscriptions;
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
 * @returns {NationalSubscription[]}
 */
getNationalSubscriptions.byStationSlug = async slug => {
  return (await getNationalSubscriptions())
    .filter(sub => sub.station_slug === slug);
};

getNationalSubscriptions.redisKey = redisKey;

module.exports = getNationalSubscriptions;
