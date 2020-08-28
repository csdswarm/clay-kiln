'use strict';

const Promise = require('../../../app/node_modules/bluebird');

const {
  removeComponentsFromContainers,
  usingDb
} = require('../migration-utils').v1;

const { parseHost } = require('../migration-utils').v2;

const host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host);
  

getPagesUsingBranchIO();

// helper functions
function removeBranchIoComponents(page, branchIOInstance) {
  return removeComponentsFromContainers({
    envInfo,
    remove: {
      [page]: {
        head: branchIOInstance
      }
    }
  })
}

async function getAllPagesWithBranchIOHead(db, host) {
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE id ~ '@published$' 
      AND data->>'head' ~ 'branch-io-head'`,
    result = await db.query(query);

  return result.rows
    .filter(({ id }) => (
      id.startsWith(host)
    ))
    .map((row) => Object.assign({}, row, { id: row.id.replace('@published', '') }))
}

async function getPagesUsingBranchIO() {
  try {
    await usingDb(async db => {
      const pages = await getAllPagesWithBranchIOHead(db, host);

      return Promise.map(pages, ({ id, data: { head } }) => {
        const branchIOInstance = head.filter(instance => instance.includes('branch-io-head'));

        return removeBranchIoComponents(id, branchIOInstance);
      }, { concurrency: 5 })
    })
  } catch (error) {
    console.log('error', error);
  }
}
