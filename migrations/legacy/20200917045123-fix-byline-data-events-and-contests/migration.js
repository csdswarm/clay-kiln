'use strict';

const { usingDb, clayExport, clayImport } = require('../migration-utils').v1,
  _get = require('lodash/get'),
  host = process.argv[2] || 'clay.radio.com',
  Promise = require('../../../app/node_modules/bluebird/js/release/bluebird');

run();

// helper functions
async function getEventAndContestInstances(db, host) {
  const query = `
      SELECT e.id
      FROM components.event e
      WHERE e.data->>'byline' = '[]'
    UNION
      SELECT c.id
      FROM components.contest c
      WHERE c.data->>'byline' = '[]'`,
    result = await db.query(query);

  return result.rows.filter(({ id }) => id.startsWith(host))
}

async function run() {
  try {
    await usingDb(async db => {
      const instances = await getEventAndContestInstances(db, host);
      
      return Promise.map(instances, async ({ id }) => {
        const { data } = await clayExport({ componentUrl: id }),
          instance = _get(data, '_components.event') ? _get(data, '_components.event.instances') : _get(data, '_components.contest.instances', {});
        
        Object.entries(instance)
          .map(async ([_, value]) => {
            Object.assign(value, { byline: [{ hosts: [], names: [], sources: [], prefix: 'by' }] });

            return clayImport({ hostUrl: host, payload: data });
          })
      }, { concurrency: 5 })
    })
  } catch (error) {
    console.log('error', error);
  }
}
