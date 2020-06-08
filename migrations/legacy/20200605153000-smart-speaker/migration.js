const { clayImport, clayExport, readFile, prettyJSON, _has, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};

const PAGES_INSERT_COMPONENT = [
  '_pages/station'
];

async function createDefaultAlertBanner() {
  try {
    const { data } = await readFile({ path: './smart-speaker.yml' });
    await clayImport({ payload: data, hostUrl });
  } catch (error) {
    console.log('An error occurred while trying to create the default Smart Speaker instance.', prettyJSON({error}));
    throw error;
  }
}

function getPages(){
  return Promise.all(PAGES_INSERT_COMPONENT.map(page => clayExport({ componentUrl: `${hostUrl}/${page}` })));
}

function addSmartSpeakerToPages(pages){
  return pages
    .map(({ data }) => {
      const path = PAGES_INSERT_COMPONENT
        .map(address => address.split('/'))
        .find(path => _has(data, path));
      path.push('tertiary');

      _set(data, path, [`${hostUrl}/_components/smart-speaker/instances/new`, 
      `${hostUrl}/_components/google-ad-manager/instances/mediumRectangleTop`,
      `${hostUrl}/_components/latest-recirculation/instances/station`]);

      return data;
    });
}

function importContent(content) {
  return Promise.all(content
    .map(payload => {
      try {
        return clayImport({ payload, hostUrl, publish: true })
      } catch (error) {
        console.log('An error occurred while trying to update a page or layout instance.', prettyJSON({error}));
      }
    }));
}

createDefaultAlertBanner()
  .then(logMessage('Default smart-speaker instance created.'))
  .then(() => Promise.all([getPages()]))
  .then(logMessage('Got layout pages.'))
  .then(([pages]) => Promise.all([addSmartSpeakerToPages(pages)]))
  .then(logMessage('Added smart-speaker to layout pages.'))
  .then(([pages]) => importContent([...pages]))
  .then(logMessage('Done.'))
  .catch(console.log);
