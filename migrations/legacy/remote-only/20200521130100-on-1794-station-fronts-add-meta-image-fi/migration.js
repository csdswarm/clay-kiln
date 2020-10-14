'use strict';

const { _get, clayImport, clayExport, clayutils } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  stationFrontPage = '_pages/station-front';

(async function() {
  try {
    console.log('Creating station front meta image component');
    await clayImport({
      hostUrl: host,
      payload: {
        _components: {
          'meta-image': {
            instances: {
              'station-front': {
                _version: 1,
                imageUrl: '${paramValue}',
                localsKey: 'station.square_logo_small',
                componentVariation: 'meta-image'
              }
            }
          }
        }
      }
    })
    console.log('Getting station-front page');
    const data = await clayExport({
      componentUrl: `${host}/${stationFrontPage}`
    });
    const head = _get(data, 'data._pages.station-front.head', []);
    if(!head.some(uri => clayutils.getComponentName(uri) === 'meta-image')) {
      console.log('Adding meta-image component to station front');
      head.push('/_components/meta-image/instances/station-front');
      await clayImport({
        hostUrl: host,
        payload: data.data
      })
    } else {
      console.log('station-front already has meta-image. No need to add.');
    }
  } catch (error) {
    console.error('Unable to add meta image instance to station-front page');
    console.error(error);
  }
})();
