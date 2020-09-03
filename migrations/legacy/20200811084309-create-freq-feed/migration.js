'use strict';

const fs = require('fs'),
  migrationUtils = require('../../utils/migration-utils'),
  { clayImport } = migrationUtils.v1,
  { parseHost } = migrationUtils.v2;

const { host } = parseHost(process.argv.slice(2)[0]);

run()

async function run() {
  try {
    const payload = fs.readFileSync('./_components.yml', 'utf8');

    await clayImport({ hostUrl: 'https://' + host, payload });

    console.log('created frequency feed successfully');
  } catch (err) {
    console.error(err);
  }
}
