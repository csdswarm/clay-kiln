const
  { prettyJSON, clayExport, clayImport, readFile, _get } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  colors = require('../../../app/node_modules/colors');

async function logMigrationDivider(migrationMsg, data) {
  const
    msg = `${'-'.repeat(20)} ${migrationMsg} ${'-'.repeat(20)}`,
    pre = '%'.repeat(msg.length),
    post = '%'.repeat(msg.length);

  console.log(`${pre}\n${msg}\n${post}`.blue.bgWhite);
  return data
}

function logMigrationMsg(msg) {
  console.log('Station Listen Only migration ===>'.blue, msg);
}

function loadPageDataFromYaml(path) {
  return readFile({ path })
}

function importData(data, publish = false) {
  return clayImport({ payload: data, hostUrl, publish });
}

logMigrationDivider('Begin Station Listen Only Migration')
  // load the layout data from _layouts.yml
  .then( _ => {
    logMigrationMsg('loading layout YAML...');
    return loadPageDataFromYaml('./_layouts.yml');
  })
  // import layout YAML into clay
  .then( loadLayoutFileResponse => {
    logMigrationMsg('Importing layout into clay...');
    const replacedHostYml = loadLayoutFileResponse.data.replace(/\${HOST_URL}/gi, hostUrl);
    return importData(replacedHostYml);
  })
  // load the page data from _pages.yml
  .then( _ => {
    logMigrationMsg('loading page YAML...');
    return loadPageDataFromYaml('./_pages.yml');
  })
  // import page YAML into clay
  .then( loadPageFileResponse => {
    logMigrationMsg('Importing page into clay...');
    return importData(loadPageFileResponse.data, true);
  })
  // finish up
  .then( () => {
    return logMigrationDivider('End Station Listen Only Migration');
  })
  .catch(console.log);