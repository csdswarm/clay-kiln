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

  const homepageInstanceRefs = [
      '_components/homepage/instances/home',
      '_components/homepage/instances/default'
    ],
    componentsOrder = [
      'latest-content',
      'stations-carousel',
      'google-ad-manager',
      'podcast-list',
      'latest-videos',
      'google-ad-manager',
      'more-content-feed',
      'two-column-component'
    ];

  await Promise.all(homepageInstanceRefs.map(async homepageInstanceRef => {
    const homepageInstanceRefPath = homepageInstanceRef.replace(/\//g, '.'),
      { data } = await clayExport({
        componentUrl: `${ host }/${ homepageInstanceRef }`
      }),
      hpData = _get(data, homepageInstanceRefPath),
      allRefs = [];

    for (const prop in hpData) {
      if (!['mainContent', '_version', 'title'].includes(prop)) {
        if (hpData[prop]._ref) allRefs.push(hpData[prop]._ref);
        else if (hpData[prop][0] && hpData[prop][0]._ref) {
          allRefs.push(hpData[prop][0]._ref);
        }
        delete hpData[prop];
      }
    }

    componentsOrder.forEach(component => {
      const _ref = allRefs.find(ref => ref.includes(component));

      if (_ref) hpData.mainContent.push({ _ref });
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
  }));
}

async function updateMultiColInstance() {
  const multiColInstancePubRef = '_components/multi-column/instances/home',
    multiColInstancePubRefPath = multiColInstancePubRef.replace(/\//g, '.'),
    { data: multiColPubData } = await clayExport({
      componentUrl: `${ host }/${ multiColInstancePubRef }`
    });

  // Remove ad from draft & published version of multi col instance
  _set(multiColPubData, `${multiColInstancePubRefPath}.mediumRectangleTop`, '');
  const { result: pubResult } = await clayImport({
    hostUrl: host, payload: multiColPubData, publish: true
  });

  if (pubResult === 'success') {
    console.log('\nUpdated multi col published instance successfully\n');
  } else {
    console.error('There was a problem updating the multi col published instance.',
      prettyJSON({ pubResult, multiColPubData })
    );
  }

  // Add ad to draft of multi col instance
  _set(multiColPubData, `${multiColInstancePubRefPath}.mediumRectangleTop`, {
    _ref: '/_components/google-ad-manager/instances/mediumRectangleTop'
  });
  const { result: draftResult } = await clayImport({
    hostUrl: host, payload: multiColPubData
  });

  if (draftResult === 'success') {
    console.log('\nUpdated multi col instance draft successfully\n');
  } else {
    console.error('There was a problem updating the multi col instance draft.',
      prettyJSON({ draftResult, multiColPubData })
    );
  }
}

updateHomepageInstance()
  .then(() => updateMultiColInstance())
  .catch(e => console.error(e));
