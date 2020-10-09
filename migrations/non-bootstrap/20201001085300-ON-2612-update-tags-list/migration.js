'use strict'
const { axios } = require('../../utils/base'),
  fs = require('fs'),
  _findIndex = require('lodash/findIndex'),
  {
    formatAxiosError,
    parseHost,
    usingDb
  } = require('../../legacy/migration-utils').v1

const host = process.argv[2] || 'clay.radio.com',
  { http } = parseHost(host)

let existingTags = [];

getCurrentList().then(
  generateUpdatedList().catch(err =>
    console.error(formatAxiosError(err, { includeStack: true }))
  )
)

async function generateUpdatedList () {
  await usingDb(db => getTagComponents(db).then(updateTags))
}

async function getCurrentList () {
  console.log('Fetching tags...')
  const { data: tags } = await axios.get(`${http}://${host}/_lists/tags`)
  existingTags = tags
  console.log(`Initial tags #${existingTags.length}`)
  fs.writeFileSync('_original.json', JSON.stringify(tags))
}

async function updateTags (rows) {
  rows.forEach(({ count, text }) => {
    const idx = _findIndex(existingTags, { text })
    if (idx >= 0) {
      existingTags[idx].count = Number(count)
    } else {
      existingTags.push({
        text,
        count: Number(count)
      })
    }
  })
  console.log(`Updated tags #${existingTags.length}`)
  const data = JSON.stringify(existingTags)
  const headers = {
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  }

  axios
    .put(`${http}://${host}/_lists/tags`, data, { headers })
    .then(() => {
      console.log('Tags Updated')
    })
    .catch(err => console.log(err))
}

async function getTagComponents (db) {
  const result = await db.query(`
  SELECT
    count(*) as count,
    i ->> 'text' as text
  FROM
    components.tags t, jsonb_array_elements(data -> 'items') i
  WHERE
    t.id NOT LIKE '%@published'
  GROUP BY
    i ->> 'text'
  `)

  return result.rows
}
