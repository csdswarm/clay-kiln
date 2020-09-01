'use strict';

const { usingDb } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  Promise = require('../../../app/node_modules/bluebird');

getPagesUsingBranchIO();

// helper functions
async function removeBranchIOComponents(db, id, data) {
  await db.query(
    `update pages
    set data = $2
    where id = $1`,
    [id, data]
  )
}

async function getAllPagesWithBranchIOHead(db, host) {
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE data->>'head' ~ 'branch-io-head'`,
    result = await db.query(query);

  return result.rows.filter(({ id }) => id.startsWith(host))
}

async function getPagesUsingBranchIO() {
  try {
    await usingDb(async db => {
      const pages = await getAllPagesWithBranchIOHead(db, host);

      return Promise.map(pages, async ({ id, data }) => {
        const { head } = data,
          [ branchIOInstance ] = head.filter(instance => instance.includes('branch-io-head')),
          index = head.indexOf(branchIOInstance);

        head.splice(index, 1);
        return await removeBranchIOComponents(db, id, data);
      }, { concurrency: 5 }
    )
    })
  } catch (error) {
    console.log('error', error);
  }
}
