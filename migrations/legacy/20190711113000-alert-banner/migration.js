const { clayImport, clayExport, parseHost, readFile, prettyJSON, _has, _set } = require('../migration-utils').v1;
const host = process.argv[2] || 'clay.radio.com';
const { url: hostUrl } = parseHost(host);
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};

const TARGET_LAYOUTS = [
  '_layouts/two-column-layout/instances/article',
  '_layouts/one-column-layout/instances/article', // probably not used, but just in case
  '_layouts/one-column-layout/instances/general'
];

async function createDefaultAlertBanner() {
  try {
    const { data } = await readFile({ path: './alert-banner.yml' });
    await clayImport({ payload: data, hostUrl });
  } catch (error) {
    console.log('An error occurred while trying to create the default alert-banner instance.', prettyJSON({error}));
    throw error;
  }
}

function getLayoutInstances(){
  return Promise.all(TARGET_LAYOUTS.map(layout => clayExport({componentUrl: `${hostUrl}/${layout}`})));
}

function addBannerToInstances(layouts){
  return layouts
    .map(({data}) => {
      const path = TARGET_LAYOUTS
        .map(address => address.split('/'))
        .find(path => _has(data, path));
      path.push('banner');
      _set(data, path, [{_ref: `${host}/_components/alert-banner/instances/default`}]);
      return data;
    });
}

function updateInstances(layoutsWithAlertBanner) {
  return Promise.all(layoutsWithAlertBanner
    .map(payload => {
      try {
        return clayImport({ payload, hostUrl, publish: true })
      } catch (error) {
        console.log('An error occurred while trying to update the alert-banner instance.', prettyJSON({error}));
      }
    }));
}

createDefaultAlertBanner()
  .then(logMessage('Default alert-banner instance created.'))
  .then(getLayoutInstances)
  .then(logMessage('Got Layout instances.'))
  .then(addBannerToInstances)
  .then(logMessage('Added Banners to instances.'))
  .then(updateInstances)
  .then(logMessage('Done.'))
  .catch(console.log)

