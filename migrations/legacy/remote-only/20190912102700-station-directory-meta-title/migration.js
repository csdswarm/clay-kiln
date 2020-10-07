'use strict';
const host = process.argv[2],
  { clayExport, clayImport } = require('../migration-utils').v1;

const STATIONS_DIRECTORY_PAGE = '/_pages/stations-directory',
    META_TITLE_INSTANCE = '/_components/meta-title/instances/stations-directory',
    META_DESCRIPTION_INSTANCE = '/_components/meta-description/instances/stations-directory',
    META_IMAGE_INSTANCE = '/_components/meta-image/instances/og-logo';

const checkArrayForString = (arr, checkStr) => arr.some(str => str.includes(checkStr));

clayExport({componentUrl: `${host}${STATIONS_DIRECTORY_PAGE}`})
    .then(({data}) => {
        [META_TITLE_INSTANCE, META_DESCRIPTION_INSTANCE, META_IMAGE_INSTANCE].forEach(instance => {
            if (!checkArrayForString(data._pages['stations-directory'].head, instance)) {
                data._pages['stations-directory'].head.push(`${instance}`)
            }
        });
        return clayImport({hostUrl: host, payload: data, publish: true});
    });

