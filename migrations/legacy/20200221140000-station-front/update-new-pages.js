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
    existingStationFront = data.some(item => item.id === 'station-front'),
    existingStationsIdx = data.findIndex(item => item.id === 'stations');

  // delete existing station basic music entry
  if (existingStationsIdx !== -1) {
    data.splice(existingStationsIdx, 1);
  }

  if (!existingStationFront) {
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
