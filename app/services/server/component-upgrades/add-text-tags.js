'use strict';

const _map = require('lodash/map'),
  db = require('amphora-storage-postgres'),
  { getComponentName } = require('clayutils');

/**
 * returns the tags associated with the content
 *
 * @param {string} contentUri
 * @returns {string[]}
 */
async function getTags(contentUri) {
  const { rows } = await db.raw(`
    select jsonb_array_elements(t.data->'items')->>'text' as text
    from components.tags t
      join components.${getComponentName(contentUri)} c
        on t.id = c.data->'tags'->>'_ref'
    where c.id = ?
  `, [contentUri]);

  return _map(rows, 'text');
}

module.exports = async (uri, data) => {
  data.textTags = data.textTags || await getTags(uri);

  return data;
};
