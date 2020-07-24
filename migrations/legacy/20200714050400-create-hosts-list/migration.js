'use strict';

/**
 *  - This file creates a new list for hosts.
 */

const { clayImport } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  hosts = [];

run()

async function run() {
  // construct the payload.
  const payload = {
    _lists : {
      'hosts' : hosts
    }
  }
  
  try {
    console.log('Creating the hosts list');
    await clayImport({ payload, hostUrl });
    console.log('Hosts list created successfully!');
  } catch (error) {
    console.error(`An error occurred while trying to create the list`, error);
  }
}
