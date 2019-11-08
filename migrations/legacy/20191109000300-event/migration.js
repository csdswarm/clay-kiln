const
  { prettyJSON, clayImport, readFile } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com';

async function logMigrationDivider(migrationMsg, data) {
  const
    msg = `${'='.repeat(10)} ${migrationMsg} ${'='.repeat(10)}`,
    pre = '*'.repeat(msg.length),
    post = '*'.repeat(msg.length);
  
  console.log(`${pre}\n${msg}\n${post}`);
  return data
}

function logEventMigrationMsg(msg) {
  console.log('event migration ===>', msg);
}

function loadPageDataFromYaml(path) {
  return readFile({ path })
}

function importData(data) {
  return clayImport({ payload: data, hostUrl });
}

logMigrationDivider('Begin Event Migration')
  .then( _ => {
    logEventMigrationMsg('loading event page YAML...');
    return loadPageDataFromYaml('./_pages.yml');
  })
  .then(loadFileResponse => {
    logEventMigrationMsg('Importing event page into clay...');
    return importData(loadFileResponse.data);
  })
  .then( clayImportResponse => {
    logEventMigrationMsg(
      prettyJSON(clayImportResponse)
    );
    return logMigrationDivider('End Event Migration')
  })
  .catch(console.log);
