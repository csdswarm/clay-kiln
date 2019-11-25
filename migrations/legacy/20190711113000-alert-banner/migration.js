const { clayImport, clayExport, readFile, prettyJSON, _has, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};

const LAYOUTS_INSERT_COMPONENT = [
  '_layouts/two-column-layout/instances/article'
];

const LAYOUTS_INSERT_PAGEAREA = [
  '_layouts/one-column-layout/instances/general'
];

const PAGES_INSERT_COMPONENT = [
  '_pages/home',
  '_pages/news',
  '_pages/sports',
  '_pages/music',
];

const TARGET_LAYOUTS = [
  ...LAYOUTS_INSERT_PAGEAREA,
  ...LAYOUTS_INSERT_COMPONENT
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

function getPages(){
  return Promise.all(PAGES_INSERT_COMPONENT.map(page => clayExport({ componentUrl: `${hostUrl}/${page}` })));
}

function addBannerToLayouts(layouts){
  return layouts
    .map(({ data }) => {
      const [path, target] = TARGET_LAYOUTS
        .map(address => [address.split('/'), address])
        .find(path => _has(data, path[0]));
      path.push('banner');

      const injectComponent = LAYOUTS_INSERT_COMPONENT.includes(target);

      const value = injectComponent ? [{_ref: `${hostUrl}/_components/alert-banner/instances/default`}] : 'banner';

      _set(data, path, value);

      return data;
    });
}

function addBannerToPages(pages){
  return pages
    .map(({ data }) => {
      const path = PAGES_INSERT_COMPONENT
        .map(address => address.split('/'))
        .find(path => _has(data, path));
      path.push('banner');

      _set(data, path, [`${hostUrl}/_components/alert-banner/instances/default`]);

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
  .then(logMessage('Default alert-banner instance created.'))
  .then(() => Promise.all([getLayoutInstances(), getPages()]))
  .then(logMessage('Got layout instances and pages.'))
  .then(([layouts, pages]) => Promise.all([addBannerToLayouts(layouts), addBannerToPages(pages)]))
  .then(logMessage('Added banner to layout instances and pages.'))
  .then(([layouts, pages]) => importContent([...layouts, ...pages]))
  .then(logMessage('Done.'))
  .catch(console.log);
