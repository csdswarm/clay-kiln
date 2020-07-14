'use strict';

/*
* Migration created to add a new ad instance similar to 'mediumRectangleBottom' with the difference that
* this new 'mediumRectangleContentBody' isn't sticky.
*/

const { _set, clayImport, clayExport } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  componentInstance = '_components/google-ad-manager/instances';

(async () => {
  try {
    // get the existing data
    let data = await clayExport({
      componentUrl: `${host}/${componentInstance}`
    });

    // adding the ad instance
    _set(data, 'data._components.google-ad-manager.instances.mediumRectangleContentBody', {
      "adSize": "medium-rectangle",
      "adPosition": "rec",
      "adLocation": "btf",
      "sticky": false
    });

    // upload the new data
    console.log(`Saving 'mediumRectangleContentBody' instance to google-ad-manager component.`)
    await clayImport({
      hostUrl: host,
      payload: data.data,
      publish: true
    });
  } catch(error) {
    console.error('Unable to add ad instance to google-ad-manager component');
    console.error(error);
  }
  
})();

