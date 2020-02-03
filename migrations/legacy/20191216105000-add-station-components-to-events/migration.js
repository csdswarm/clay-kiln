const { clayImport, clayExport, _get, _set } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

const LAYOUTS = [
  { componentUrl: `${hostUrl}/_layouts/two-column-layout/instances/event`, path: '_layouts.two-column-layout.instances.event' }
];

const STATION_NAV = { _ref: `${hostUrl}/_components/station-nav/instances/default` };
const STATION_FOOTER = { _ref: `${hostUrl}/_components/station-footer/instances/default` };
const STATION_THEME = { _ref: `${hostUrl}/_components/theme/instances/default`};

function addStationComponents (layoutData) {
  const { top, bottom } = layoutData,
    insertNavAfter = top.findIndex(({ _ref }) => _ref.includes('top-nav')),
    insertFooterBefore = bottom.findIndex(({ _ref }) => _ref.includes('footer')),
    navIndex = top.findIndex(({ _ref }) => _ref.includes('station-nav')),
    footerIndex = bottom.findIndex(({ _ref }) => _ref.includes('station-footer')),
    themeIndex = top.findIndex(({ _ref }) => _ref.includes('_components/theme'));

  // Add station nav if it doesn't exist
  if (navIndex === -1) {
    top.splice(insertNavAfter + 1, 0, STATION_NAV);
  }

  // Add station theme above nav if it doesn't exist
  if (themeIndex === -1) {
    top.splice(insertNavAfter + 1, 0, STATION_THEME);
  }

  // Add station footer if it doesn't exist
  if (footerIndex === -1) {
    bottom.splice(insertFooterBefore, 0, STATION_FOOTER);
  }

  layoutData.top = top;
  layoutData.bottom = bottom;

  return layoutData;
}

async function updateLayout (layoutInfo) {
  console.log(`\nUpdating ${layoutInfo.componentUrl}...`);

  const { componentUrl, path } = layoutInfo,
    { data: layout } = await clayExport({ componentUrl });
    updatedLayout = _set(layout, path, addStationComponents(_get(layout, path)));

  return await clayImport({ hostUrl, payload: updatedLayout, publish: true });
}

async function updateLayouts () {
  console.log('Adding station components to event layouts...\n');

  try {
    for (let layout of LAYOUTS) {
      await updateLayout(layout);
    }
  } catch (error) {
    console.error(error);
  }

  console.log('\nDone.\n');
}

updateLayouts();
