const { clayImport, clayExport, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

const stationNav = `${hostUrl}/_components/station-nav/instances/default`;
const primaryLinkPath = [ '_components', 'station-nav', 'instances', 'default', 'primaryLinks' ];

const getStationNav = async () => {
  const { data } = await clayExport({ componentUrl: stationNav });

  return data;
};

const removePrimaryLinks = async (componentData) => {
  _set(componentData, primaryLinkPath, []);

  return clayImport({ hostUrl, payload: componentData, publish: true })
};

console.log('Removing primaryLinks from default station-nav instance...\n');

getStationNav()
  .then(removePrimaryLinks)
  .then(() => console.log('\nDone.'))
  .catch(console.error);
