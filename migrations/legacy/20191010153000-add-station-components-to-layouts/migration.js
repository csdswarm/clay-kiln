const { clayImport, clayExport, _get, _set, _findIndex } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';
const { inspect } = require('util');

const LAYOUTS = [
  { componentUrl: `${hostUrl}/_layouts/one-column-layout/instances/general`, path: '_layouts.one-column-layout.instances.general' },
  { componentUrl: `${hostUrl}/_layouts/one-column-layout/instances/article`, path: '_layouts.one-column-layout.instances.article' },
  { componentUrl: `${hostUrl}/_layouts/two-column-layout/instances/article`, path: '_layouts.two-column-layout.instances.article' }
];

const STATION_NAV = { _ref: `${hostUrl}/_components/station-nav/instances/default` };
const STATION_FOOTER = { _ref: `${hostUrl}/_components/station-footer/instances/default` };

function addStationComponents (layoutData) {
  const { top, bottom } = layoutData,
    insertNavAfter = _findIndex(top, ({ _ref }) => /top\-nav/.test(_ref)),
    insertFooterBefore = _findIndex(bottom, ({ _ref }) => /footer/.test(_ref)),
    navIndex = _findIndex(top, ({ _ref }) => /station\-nav/.test(_ref)),
    footerIndex = _findIndex(bottom, ({ _ref }) => /station\-footer/.test(_ref));

  // Add station nav if it doesn't exist
  if (navIndex === -1) {
    top.splice(insertNavAfter + 1, 0, STATION_NAV);
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
  console.log('Adding station components to content layouts...\n');

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
