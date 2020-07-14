'use strict';

/**
 *  - This file creates a new list for the listen-only experience layout.
 */

const { clayImport } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  listenOnlyStationStyle = [];

run()

async function run() {
  // construct the payload.
  const payload = {
    _lists : {
      'listen-only-station-style' : listenOnlyStationStyle
    }
  }

  try {
    console.log('Creating the listen-only-station-style list');
    await clayImport({ payload, hostUrl });
    console.log('List listen-only-station-style created successfully!');
  } catch (error) {
    console.error(`An error occurred while trying to create the list`, error);
  }
}
