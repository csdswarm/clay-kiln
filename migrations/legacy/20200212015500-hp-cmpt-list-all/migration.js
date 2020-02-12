const {
  _get,
  _set,
  clayExport,
  clayImport,
  prettyJSON,
} = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com';

async function updateHomepageInstance() {
  console.log('Updating homepage instance to move all child instances on page into component list...');

  const homepageInstanceRef = '_components/homepage/instances/home';
    homepageInstanceRefPath = homepageInstanceRef.replace(/\//g, '.'),
    componentsOrder = [
      'latest-content',
      'stations-carousel',
      'google-ad-manager',
      'podcast-list',
      'latest-videos',
      'google-ad-manager',
      'more-content-feed'
    ],
    { data } = await clayExport({
      componentUrl: `${ host }/${ homepageInstanceRef }`
    }),
    hpData = _get(data, homepageInstanceRefPath),
    allRefs = [];

  for (const prop in hpData) {
    if (prop !== 'mainContent') {
      if (hpData[prop]._ref) allRefs.push(hpData[prop]._ref);
      else allRefs.push(hpData[prop][0]._ref);
      delete hpData[prop];
    }
  }

  componentsOrder.forEach(component => {
    const _ref = allRefs.find(ref => ref.includes(component));

    hpData.mainContent.push({ _ref });
  })

  _set(data, homepageInstanceRefPath, hpData);

  const { result } = await clayImport({
    hostUrl: host, payload: data, publish: true
  });

  if (result === 'success') {
    console.log('\nUpdated homepage instance successfully\n');
  } else {
    console.error('There was a problem updating the homepage instance.', prettyJSON({ result, data }));
  }
}

updateHomepageInstance().catch(e => console.error(e));
