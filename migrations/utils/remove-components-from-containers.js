'use strict';

const ensureStartsWith = require('./ensure-starts-with').v1;
const usingDb = require('./using-db').v1;
const { _, axios, bluebird, clayutils } = require('./base');

/**
 * @param envInfo {object} - the result of parseHost.v2
 * @param remove {object} - an object which describes what we want to remove
 *   the schema is
 *   {
 *     [container id]: {
 *       [container data key]: [component ids to remove]
 *     }
 *   }
 *
 *   so if I pass
 *   {
 *     '/_pages/station': {
 *       head: ['/_components/meta-title/instances/general']
 *     }
 *   }
 *
 *   then that means I will remove the general meta-title component from the
 *   head of the station page.
 *
 *   note 1: this method accounts for the differences between component lists in
 *     pages and layouts, where in pages it is an array of strings while layouts
 *     have arrays of objects with '_ref'.  The input in the remove object will
 *     be the same for both i.e. you should not pass an array of objects with
 *     ref properties.
 *
 *   note 2: none of the ids should have @published.  This method is intended to
 *     update containers then publish the result.  If this becomes a problem we
 *     can add verification logic at that time.
 */
async function removeComponentsFromContainers_v1(argObj) {
  await usingDb(async db => {
    const { envInfo } = argObj;
    let { remove } = argObj;

    if (!envInfo || !remove) {
      throw new Error('envInfo and remove are required parameters');
    }
    if (!envInfo.host) {
      throw new Error(
        "envInfo must have the 'host' parameter supplied by parseHost.v2"
      );
    }

    const { host } = envInfo;

    remove = sanitizeRemove({ host, remove });

    const containerIds = Object.keys(remove);

    let containers = await bluebird.map(
      containerIds,
      id => getContainer(id, db),
      { concurrency: 5 }
    );

    await updateContainers(containers, remove, db);

    await bluebird.map(
      containerIds,
      id => axios(`${envInfo.http}://${id}@published`, {
        method: 'put',
        headers: { Authorization: 'token accesskey' }
      }),
      { concurrency: 2 }
    );
  })
}

// helper functions

/**
 * ensures all ids in 'remove' begin with the host
 *
 * @param {string} host
 * @param {object} remove
 * @returns {object} - updated remove
 */
function sanitizeRemove({ host, remove }) {
  return _.chain(remove)
    .mapKeys((_val, key) => ensureStartsWith(host)(key))
    .mapValues(val => {
      // the keys of this object are the [container data key] in the jsdoc above
      //   so this maps over the [component ids to remove] which need to have
      //   the host prefix
      return _.mapValues(
        val,
        ids => ids.map(ensureStartsWith(host))
      );
    })
    .value();
}

/**
 * using the db connection (instance of pg's "Pool"), get the data from the page
 *   or layout
 *
 * @param {string} id
 * @param {object} db
 * @returns {object} - the id and data from the db
 */
async function getContainer(id, db) {
  const result = clayutils.isPage(id)
    ? await db.query('select id, data from pages where id = $1', [id])
    // don't sql inject yourself in a migration :)
    : await db.query(
      `
      select id, data
      from layouts."${clayutils.getLayoutName(id)}"
      where id = $1
      `,
      [id]
    );

  return result.rows[0];
}

/**
 * updates the containers then saves them to the database
 *
 * @param {object[]} containers
 * @param {object} remove
 * @param {object} db
 */
async function updateContainers(containers, remove, db) {
  containers = containers.map(({ id, data }) => {
    for (const key of Object.keys(remove[id])) {
      // I understand this code is dense, what it's doing is removing the
      //   component ids passed by the leafs of the 'remove' object described
      //   in the jsdocs.
      _.update(
        data,
        key,
        components => {
          return clayutils.isPage(id)
            ? _.difference(components, remove[id][key])
            : components.filter(cmp => !remove[id][key].includes(cmp._ref));
        }
      );
    }

    return { id, data };
  });

  await bluebird.map(
    containers,
    async ({ id, data }) => {
      if (clayutils.isPage(id)) {
        await db.query(
          `
          update pages
          set data = $2
          where id = $1
          `,
          [id, data]
        )
      } else {
        await db.query(
          `
          update layouts."${clayutils.getLayoutName(id)}"
          set data = $2
          where id = $1
          `,
          [id, data]
        )
      }
    },
    { concurrency: 5 }
  );
}

module.exports = {
  v1: removeComponentsFromContainers_v1
};
