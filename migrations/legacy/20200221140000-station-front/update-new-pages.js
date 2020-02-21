'use strict';

const {
  retrieveList,
  updateList
} = require('../migration-utils').v1;

const LIST = 'new-pages';

/**
 * Add "station-front" page to "new-pages" list
 *
 * @param {string} host - Clay host
 */
async function updateNewPages(host) {
  console.log('Adding Station Front to new pages list...');

  const data = await retrieveList(host, LIST),
    existingItem = data.some(item => item.id === 'station-front');

  if (!existingItem) {
    await updateList(host, LIST, [
      ...data,
      {
        id: 'station-front',
        title: '3. Station Front',
        children: [
          {
            id: 'station-front',
            title: 'Station Front'
          }
        ]
      }
    ]);

    console.log('Finished adding Station Front into new pages list.');
  } else {
    console.log('Station Front is already in new pages list.');
  }
}

module.exports = updateNewPages;
