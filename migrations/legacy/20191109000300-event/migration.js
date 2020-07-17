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

function logEventMigrationMsg(msg) {
  console.log('event migration ===>'.blue, msg);
}

function loadPageDataFromYaml(path) {
  return readFile({ path })
}

function importData(data, publish = false) {
  return clayImport({ payload: data, hostUrl, publish });
}

function exportNewPages() {
  return clayExport({ componentUrl: `${hostUrl}/_lists/new-pages` });
}

async function insertNewEventPage(listData) {
  const
    newData = {
      id: 'event',
      title: 'Event'
    },
    generalContentPages = _find(_get(listData,'_lists.new-pages',[]), { id: 'General-content' });

  if(!generalContentPages) {
    throw new Error('New Pages data not found.')
  }

  const newPagesChildren = _get(generalContentPages, 'children');

  if(!newPagesChildren) {
    throw new Error('New Pages children data not found.')
  }

  if(!_find(newPagesChildren, {id: "event"})) {
    newPagesChildren.push(newData);
  }

  if(!_find(newPagesChildren, newData)) {
    throw new Error('New data wasn\'t inserted.')
  }

  return listData;
}

logMigrationDivider('Begin Event Migration')
  // load the layout data from _layouts.yml
  .then( _ => {
    logEventMigrationMsg('loading event layout YAML...');
    return loadPageDataFromYaml('./_layouts.yml');
  })
  // import layout YAML into clay
  .then( loadLayoutFileResponse => {
    logEventMigrationMsg('Importing event layout into clay...');
    const replacedHostYml = loadLayoutFileResponse.data.replace(/\${HOST_URL}/gi, hostUrl);
    return importData(replacedHostYml, true);
  })
  // load the page data from _pages.yml
  .then( _ => {
    logEventMigrationMsg('loading event page YAML...');
    return loadPageDataFromYaml('./_pages.yml');
  })
  // import page YAML into clay
  .then( loadPageFileResponse => {
    logEventMigrationMsg('Importing event page into clay...');
    return importData(loadPageFileResponse.data);
  })
  // export the new-pages list data
  .then( clayImportResponse => {
    logEventMigrationMsg('Exporting new-pages list...');
    return exportNewPages();
  })
  // insert the event page into the General-content.children array
  .then( exportNewPagesResponse => {
    logEventMigrationMsg('Inserting event into new-pages list...');
    return insertNewEventPage(exportNewPagesResponse.data);
  })
  // import that back into clay
  .then( insertNewEventPageResponse => {
    logEventMigrationMsg('Importing new list data into clay...');
    return importData(insertNewEventPageResponse);
  })
  // finish up
  .then( importListDataResponse => {
    logEventMigrationMsg(`Import complete ${importListDataResponse.result}`);
    return logMigrationDivider('End Event Migration');
  })
  .catch(console.log);