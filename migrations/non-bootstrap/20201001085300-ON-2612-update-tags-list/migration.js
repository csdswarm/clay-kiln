'use strict'

let fetchMore = true;

const { 
  bluebird,
  axios
} = require('../../utils/base'),
  fs = require('fs'),
  _find = require('lodash/find'),
{
  formatAxiosError,
  parseHost,
  usingDb
} = require('../../legacy/migration-utils').v1;

const host = process.argv[2] || 'clay.radio.com',
  { http } = parseHost(host);

let updatedTags = [],
  existingTags = [],
  OFFSET = 0,
  LIMIT = 5000,
  SLEEP = 1000,
  COUNT = 0;
  

getCurrentList().then(
  generateUpdatedList()
  .catch(err => console.error(formatAxiosError(err, { includeStack: true })))
);

async function generateUpdatedList() {
  await usingDb(db => getTagComponents(db, OFFSET, LIMIT)
    .then(appendTags)
    .then(number => {
      if (fetchMore) {
        COUNT += number;
        generateUpdatedList();
      } else {
        // Update the list with new values.
        fs.writeFileSync('_created.json', JSON.stringify(updatedTags))
        updateCurrentList();
      }
    })
  );
}

async function getCurrentList() {
  console.log('Fetching original list...');
  const { data: tags } = await axios.get(`${http}://${host}/_lists/tags`);
  existingTags = tags;
  updatedTags = existingTags;
  fs.writeFileSync('_original.json', JSON.stringify(tags))
}

async function updateCurrentList() {

  const data = JSON.stringify(updatedTags)
  const headers = { 
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  };
  // await axios.put(`${http}://${id}`, data, { headers }).catch(err => console.log(err));
  axios.put(`http://clay.radio.com/_lists/tags`, data, { headers })
    .then(() => {
      console.log('Tag list updated');
    })
    .catch(err => console.log(err));
  
}

async function appendTags(rows) {
  rows.forEach(({ data }) => {
    data.forEach(tag => {
      if(!_find(updatedTags, { text: tag })) {
        updatedTags.push({
          text: tag,
          count: 0
        });
      }
    })
  })

  return rows.length;
}

async function getTagComponents(db, offset, limit) {
  console.log(`Entry #${COUNT}`);
  await new Promise(resolve => setTimeout(resolve, SLEEP));
  const result = await db.query(`
    select data->'textTags' as data
    from components.tags
    where data->>'textTags' IS NOT NULL
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  if (result.rows.length === 0) {
    fetchMore = false;
  }
  // update the offset for querying.
  OFFSET = OFFSET + LIMIT;
  return result.rows;
}
