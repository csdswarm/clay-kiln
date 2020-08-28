'use strict'
const axios = require('../../../app/node_modules/axios');
const { bluebird } = require('../../utils/base');
const {
  usingDb
} = require('../../legacy/migration-utils').v1

const host = process.argv[2] || 'clay.radio.com',
  protocol = host === 'clay.radio.com' ? 'http' : 'https';

console.log('Updating meta url to migrated content....')
updateMigratedPages().catch(err => console.log(err))

async function getAllMigratedContent (db, host) {
  const result = await db.query(`
    SELECT id, meta ->> 'urlHistory' as redirect, meta
    FROM public.pages
    WHERE (meta ->> 'url') like '%migrate%'
    AND meta -> 'urlHistory' -> 0 is not null;
    `)

    return (
      result.rows.map(
        ({ id, redirect, meta }) => {
          let path = JSON.parse(redirect);

          meta.url = path[0];

          return ({id, path, meta})
        }
      )
      .filter(
        ({id}) =>
          //   skip bad rows comming from different hosts
          id.startsWith(host) 
      )
    )
}

async function updateMigratedMetaUrls (pageId, data) {
  const metaTagsComponent = `${protocol}://${pageId}/meta`;
  return await axios.put(`${metaTagsComponent}`, data, { headers: { Authorization: 'token accesskey', 'Content-Type': 'application/json' } })
    .then((response) => {
      console.log('Successfully Updated Migrated Content. \n', response.data);
    })
    .catch((error) => {
      console.log('An error occured Updating migrated page. \n ERROR: ', error);
    }); 
}

async function updateMigratedPages () {
  await usingDb(async db => {
    const migratedItems = (await getAllMigratedContent(db, host));
    bluebird.map(
      migratedItems,
      async ({ id, meta }) => {
        try {
          await updateMigratedMetaUrls(id, meta)
        } catch (error) {
          console.log(error)
        }
      },
      { concurrency: 5 }
    )
  })
}
