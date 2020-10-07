'use strict';

const migrationUtils = require('../../utils/migration-utils');

const { axios } = migrationUtils.v1,
  {
    getComponentInstance,
    getComponentVersion,
    getLayoutName
  } = migrationUtils.v1.clayutils,
  { parseHost, usingDb } = migrationUtils.v2,
  { host, http } = parseHost(process.argv[2]),
  footerBillboard = {
    _ref: `${host}/_components/google-ad-manager/instances/footer-billboard`
  },
  footerBillboardPublished = {
    _ref: `${host}/_components/google-ad-manager/instances/footer-billboard@published`
  }

usingDb(async db => {
  console.log('replacing billboardBottom with footer-billboard in layouts');

  try {
    await addFooterBillboard('');
    await addFooterBillboard('@published');

    await Promise.all([
      replaceBillboardIn('bottom', db),
      replaceBillboardIn('bottomAd', db)
    ]);

    console.log('success');
  } catch (err) {
    console.error(err);
  }
})

function addFooterBillboard(version) {
  const content = {
    adSize: 'footer-billboard',
    adLocation: 'btf',
    adPosition: 'bottom'
  };

  return axios.put(
    `${http}://${host}/_components/google-ad-manager/instances/footer-billboard${version}`,

    // typically when we publish we don't send any data and let amphora do
    //   the copying from latest -> published
    version ? {} : content,

    { headers: { Authorization: 'token accesskey' } }
  )
}

async function replaceBillboardIn(location, db) {
  const replaceInstance = makeReplaceInstance(location),
    { rows } = await db.query(`
      select id, data
      from (
        select * from layouts."one-column-full-width-layout"
        union
        select * from layouts."one-column-layout"
        union
        select * from layouts."two-column-layout"
      ) layout
      where data->'${location}'@>'[{"_ref":"${host}/_components/google-ad-manager/instances/billboardBottom"}]'
        or data->'${location}'@>'[{"_ref":"${host}/_components/google-ad-manager/instances/billboardBottom@published"}]'
    `)

  rows.forEach(replaceInstance);

  for (const aRow of rows) {
    const layout = getLayoutName(aRow.id)

    await db.query(`
      update layouts."${layout}"
      set data = '${JSON.stringify(aRow.data)}'
      where id = '${aRow.id}'
    `)
  }
}

function makeReplaceInstance(location) {
  return (row, idx) => {
    const field = row.data[location];

    if (!field) {
      return row;
    }

    const idxPublished = field.findIndex(({ _ref }) => (
        getComponentInstance(_ref) === 'billboardBottom'
        && getComponentVersion(_ref) === 'published'
      )),
      idxLatest = field.findIndex(({ _ref }) => (
        getComponentInstance(_ref) === 'billboardBottom'
        && !getComponentVersion(_ref)
      ));

    if (idxPublished >= 0) {
      field[idxPublished] = footerBillboardPublished;
    }
    if (idxLatest >= 0) {
      field[idxLatest] = footerBillboard;
    }
  };
}
