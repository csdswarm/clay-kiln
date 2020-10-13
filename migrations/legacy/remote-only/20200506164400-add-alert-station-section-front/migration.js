'use strict';

const { _set, clayImport, clayExport } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  layoutInstance = '_layouts/one-column-layout/instances/general';

(async function() {
  try {
    // get the existing data
    const data = await clayExport({
      componentUrl: `${host}/${layoutInstance}`
    });

    // adding the banner instance
    _set(data, 'data._layouts.one-column-layout.instances.general.banner', [{
      _ref: '/_components/alert-banner/instances/default'
    }]);

    // upload the new data
    await clayImport({
      hostUrl: host,
      payload: data.data,
      publish: true
    });
  } catch (error) {
    console.error('Unable to add banner instance to general component');
    console.error(error);
  }
})();
