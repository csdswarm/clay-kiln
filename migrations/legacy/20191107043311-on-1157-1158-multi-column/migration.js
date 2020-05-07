'use strict';
const {
  _set,
  _unset,
  clayExport,
  clayImport,
  prettyJSON,
} = require('../migration-utils').v1;
const mcData = require('./_components.multi-column.instances.home.json');

const host = process.argv[2] || 'clay.radio.com';

const slashToDot = val => val.split('/').join('.');

const homepageInstancesRef = '_components/homepage/instances';
const multiColumnInstancesRef = '_components/multi-column/instances';

const homepageInstancesPath = slashToDot(homepageInstancesRef);
const multiColumnInstancesPath = slashToDot(multiColumnInstancesRef);

/**
 * Updates the homepage instance to show the new multi-column component
 * @returns {Promise<{result: ("success"|"fail"), params: Object, messages?: Object[], error?: Object}|*>}
 */
async function updateHomepageInstances() {
  console.log('Updating homepage component with new multi-column component\n');
  const { data } = await clayExport({ componentUrl: `${host}/${homepageInstancesRef}` });

  _unset(data, `${homepageInstancesPath}.home.sectionLead`);
  _unset(data, `${homepageInstancesPath}.default.sectionLead`);

  _set(data, `${multiColumnInstancesPath}.home`, mcData);
  _set(data, `${homepageInstancesPath}.home.mainContent`, [{ _ref: `/${multiColumnInstancesRef}/home` }]);
  _set(data, `${homepageInstancesPath}.default.mainContent`, [{ _ref: `/${multiColumnInstancesRef}/home` }]);

  const { result } = await clayImport({ hostUrl: host, payload: data, publish: true });

  if (result === 'success') {
    console.log('\nUpdated homepage instances successfully\n');
  } else {
    console.error('There was a problem updating the homepage instances.', prettyJSON({ result, data }));
  }
  return result;
}

async function run() {
  console.log('Started adding multi-column instances\n');

  try {
    await updateHomepageInstances();
  } catch (error) {
    console.error('There was an error adding multi-column instances', error);
  }
  console.log('Finished adding multi-column instances.\n');
}

run()
  .catch(console.error);
