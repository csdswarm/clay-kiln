const { clayImport, clayExport, _get, _set } = require("../migration-utils").v1;
const hostUrl = process.argv[2] || "clay.radio.com";
const layout = {
  componentUrl: `${hostUrl}/_layouts/two-column-layout/instances/static-page`,
  path: "_layouts.two-column-layout.instances.static-page",
};
const STATION_NAV = {
  _ref: `${hostUrl}/_components/station-nav/instances/default`,
};
const STATION_FOOTER = {
  _ref: `${hostUrl}/_components/station-footer/instances/default`,
};

function addStationComponents(layoutData) {
  const { top, bottom } = layoutData,
    insertNavAfter = top.findIndex(({ _ref }) => /top\-nav/.test(_ref)),
    insertFooterBefore = bottom.findIndex(({ _ref }) => /footer/.test(_ref)),
    navIndex = top.findIndex(({ _ref }) => /station\-nav/.test(_ref)),
    footerIndex = bottom.findIndex(({ _ref }) => /station\-footer/.test(_ref));

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

async function updateLayout(layoutInfo) {
  console.log(`\nUpdating ${layoutInfo.componentUrl}...`);
  const { componentUrl, path } = layoutInfo;
  console.log(`\nUpdating ${componentUrl}...`);
  const { data: layout } = await clayExport({ componentUrl });
  updatedLayout = _set(layout, path, addStationComponents(_get(layout, path)));

  return await clayImport({ hostUrl, payload: updatedLayout, publish: true });
}

async function updateLayouts() {
  console.log("Adding station components to content layout...\n");
  console.log("layout: ", layout);

  try {
    await updateLayout(layout);
  } catch (error) {
    console.error(error);
  }
  console.log("\nDone.\n");
}

updateLayouts();
