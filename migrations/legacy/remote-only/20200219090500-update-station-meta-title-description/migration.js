'use strict';

const v1Utils = require('../../utils/migration-utils').v1,
  { _set, clayExport, clayImport } = v1Utils,
  hostUrl = process.argv[2] || 'clay.radio.com';

const META_TITLE = '/_components/dynamic-meta-title/instances/station',
  META_DESCRIPTION = '/_components/dynamic-meta-description/instances/station';

run();

async function run() {
  try {
    console.log('Updating meta data for station listen pages...');

    await Promise.all([
      updateMetaTitle(),
      updateMetaDescription()
    ])

    console.log('Sucessfully updated meta data for station listen pages.');
  } catch (err) {
    console.error(err.stack);
  }
}

async function updateMetaDescription () {
  const { data: payload } = await clayExport({ componentUrl: `${hostUrl}${META_DESCRIPTION}`});

  _set(
    payload,
    '_components.dynamic-meta-description.instances.station.localsKey',
    'station.description'
  );

  return clayImport({ hostUrl, payload, publish: true });
}

async function updateMetaTitle () {
  const { data: payload } = await clayExport({ componentUrl: `${hostUrl}${META_TITLE}`});

  _set(
    payload,
    '_components.dynamic-meta-title.instances.station.suffix',
    ' - LISTEN LIVE | RADIO.COM'
  );

  _set(
    payload,
    '_components.dynamic-meta-title.instances.station.metaLocalsPath',
    [ 'station.name', 'station.slogan' ]
  );

  return clayImport({ hostUrl, payload, publish: true });
}
