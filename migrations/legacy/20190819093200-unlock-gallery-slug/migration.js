const { clayImport, clayExport, _set } = require('../migration-utils').v1;
const host = process.argv[2] || 'clay.radio.com';
const logMessage = message => data => {
  console.log(message + '\n\n');
  return data
};

const COMPONENT_INSTANCE = '_components/gallery/instances/new';

function getComponentInstance() {
  return clayExport({ componentUrl: `${host}/${COMPONENT_INSTANCE}` });
}

function updateComponentInstance({ data }) {
  const path = COMPONENT_INSTANCE.split('/');

  // disable slugLock and add empty slug
  _set(data, [...path, 'slugLock'], false);
  _set(data, [...path, 'slug'], '');

  return data;
}

function importComponent(payload) {
  return clayImport({
    payload,
    hostUrl: host,
    publish: true
  });
}

getComponentInstance()
  .then(logMessage('Retrieved new gallery instance.'))
  .then(updateComponentInstance)
  .then(logMessage('Updated new gallery instance.'))
  .then(importComponent)
  .then(logMessage('Done.'))
  .catch(console.error);
