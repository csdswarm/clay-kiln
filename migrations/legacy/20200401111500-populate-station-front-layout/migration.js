const { clayImport, clayExport, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

const
  DEFAULT_COMPONENTS = [
    { _ref: `${hostUrl}/_components/section-lead/instances/new` },
    { _ref: `${hostUrl}/_components/google-ad-manager/instances/billboardBottom` },
    { _ref: `${hostUrl}/_components/two-column-component/instances/station-front` }
  ],
  stationFrontTwoCol = {

  },
  stationFronts = [
    {
      componentUrl: `${hostUrl}/_components/station-front`,
      path: '_components.station-front.mainContent',
      publish: false
    },
    {
      componentUrl: `${hostUrl}/_components/station-front/instances/new`,
      path: '_components.station-front.instances.new.mainContent',
      publish: true
    }
  ];

run();

async function run () {
  console.log('Updating default components for station-fronts...');
  console.log('Creating station-front two-column-component...');
  await createTwoColumnComponent();

  console.log('Updating station-fronts to use new two-column-component and section-lead...');
  await Promise.all(stationFronts.map(updateStationFront));
}

async function createTwoColumnComponent () {
  const payload = require('./getTwoColumnData')(hostUrl);

  return clayImport({ payload, hostUrl, publish: true });
}

async function updateStationFront (info) {
  const { componentUrl, path, publish } = info;

  const { data: payload } = await clayExport({ componentUrl });

  _set(payload, path, DEFAULT_COMPONENTS);

  return clayImport({ payload, hostUrl, publish });
}
