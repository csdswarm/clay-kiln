'use strict';

/**
 *  - This file creates a new list for the listen-only experience layout.
 */

const { clayImport } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  listenOnlyLayoutStyle = [];

run()

async function run() {
  // construct the payload.
  const payload = {
    _lists : {
      'listen-only-layout-style' : listenOnlyLayoutStyle
    }
  }

  try {
    console.log('Creating the listen-only-layout-style list');
    await clayImport({ payload, hostUrl });
    console.log('List listen-only-layout-style created successfully!');
  } catch (error) {
    console.error(`An error occurred while trying to create the list`, error);
  }
}
