const
  { prettyJSON, clayExport, clayImport, readFile, _get } = require('../migration-utils').v1,
  _find = require('../../../app/node_modules/lodash/find'),
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
  console.log('event migration ===>'.blue, msg);
}

function loadDataFromYaml(path) {
  return readFile({ path })
}

function importData(data, publish = false) {
  return clayImport({ payload: data, hostUrl, publish });
}

logMigrationDivider('Begin Event Migration')
  // load the layout data from _layouts.yml
  .then( _ => {
    logMigrationMsg('loading contest layout YAML...');
    return loadDataFromYaml('./layouts.yml');
  })
  // import layout YAML into clay
  .then( loadLayoutFileResponse => {
    logMigrationMsg('Importing event layout into clay...');
    const replacedHostYml = loadLayoutFileResponse.data.replace(/\${HOST_URL}/gi, hostUrl);
    return importData(replacedHostYml, true);
  })
  .catch(err => {
    logMigrationMsg(`contest migration error`, err.stack)
  });
