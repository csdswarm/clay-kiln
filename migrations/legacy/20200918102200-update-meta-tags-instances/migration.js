'use strict';

const { addComponentToContainers,usingDb } = require('../migration-utils').v1,
  { parseHost } = require('../migration-utils').v2,
  { axios, uuid } = require('../../utils/base'),
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host),
  Promise = require('../../../app/node_modules/bluebird'),
  headers = { 
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  };

getPagesWithDefaultMetaTagsInstance()
  .catch(err => console.log(err));

async function getAllPagesWithDefaultMetaTagsInstance(db, host) {
  // fetch draft meta-tags instances for section fronts
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE data->>'head' ~ '/meta-tags/instances/general'
      AND data->>'main' ~ 'section-front'`,
    result = await db.query(query);

  return result.rows.filter(({ id }) => id.startsWith(host))
}

async function removeMetaTagComponent(db, id, data) {
  await db.query(
    `update pages
    set data = $2
    where id = $1`,
    [id, data]
  )
}

async function createMetaTagComponent (data, hash) {
  const metaTagsComponent = `/_components/meta-tags/instances/${hash}`  
  return await axios.put(`${envInfo.http}://${host}${metaTagsComponent}`, data, { headers }).catch(err => console.log(err));
}

async function getPagesWithDefaultMetaTagsInstance() {
  try {
    await usingDb(async db => {
      const pages = await getAllPagesWithDefaultMetaTagsInstance(db, host),
      { data: metaTags } = await axios.get(`${envInfo.http}://${host}/_components/meta-tags/instances/general@published`).catch(err => console.log(err));

      return Promise.map(pages, async ({ id, data }) => {
        const { head } = data,
          [ metaTagInstance ] = head.filter(instance => instance.includes('/_components/meta-tags/instances/general')),
          index = head.indexOf(metaTagInstance),
          url = id.slice(host.length).substring(1);
        
        head.splice(index, 1);
        await removeMetaTagComponent(db, id, data);

        const hash = uuid.v4();
        await createMetaTagComponent(metaTags, hash);
        
        if (!id.includes('@published')) {
          return await addComponentToContainers(
              host,
              [ url ],
              `_components/meta-tags/instances/${hash}`,
              'head'
            );
        }
      }, { concurrency: 2 })
    })
  } catch (error) {
    console.log('error', error);
  }
}
