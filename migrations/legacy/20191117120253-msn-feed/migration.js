'use strict';

const getNewComponentsYml = require('./get-new-components-yml'),
  { v1: parseHost } = require('../../utils/parse-host'),
  { v1: clayImport } = require('../../utils/clay-import');

run()

async function run() {
  try {
    console.log('running the migration for msn-feed');

    const host = process.argv[2] || 'clay.radio.com',
      envInfo = parseHost(host);

    await importNewComponents(host, envInfo.http)

    console.log('successfully imported feed-image/new');
  } catch (err) {
    console.error(err);
  }
}

// helper fns

function importNewComponents(host, http) {
  const msnYml = getNewComponentsYml(host, http);

  return clayImport({
    hostUrl: host,
    payload: msnYml
  });
}
