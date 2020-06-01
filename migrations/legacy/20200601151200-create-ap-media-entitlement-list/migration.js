'use strict';

/**
 *  - This file creates a new list for the AP Media Entitlement.
 */

const { clayImport, prettyJSON } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  apMediaEntitlement = [
	{"value": 42428, "name": "AP Top News - Business - Stories"},
	{"value": 42429, "name":"AP Top News - Entertainment - Stories"},
	{"value": 42430, "name":"AP Top News - International - Stories"},
	{"value": 42431, "name": "AP Top News - Health - Stories"},
	{"value": 42432, "name": "AP Top News - Strange - Stories"},
	{"value": 42433, "name": "AP Top News - Political - Stories"},
	{"value": 42434, "name": "AP Top News - Science - Stories"},
	{"value": 42435, "name": "AP Top News - Sports - Stories"},
	{"value": 42436, "name": "AP Top News - Technology - Stories"},
	{"value": 42437, "name": "AP Top News - General - Stories"},
	{"value": 42438, "name": "AP Top News - US Headlines - Stories"}
];
  

run()

async function run() {
  // construct the payload.
  const payload = {
    _lists : {
      'ap-media-entitlements' : apMediaEntitlement
    }
  }
  
  try {
    console.log('Creating the ap-media-entitlements list');
    await clayImport({ payload, hostUrl });
    console.log('List ap-media-entitlements created successfully!');
  } catch (error) {
    console.log(`An error occurred while trying to create the list`, prettyJSON({ error }));
  }
}

