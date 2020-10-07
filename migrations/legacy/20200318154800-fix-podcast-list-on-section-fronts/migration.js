'use strict';

const { v1: { _get, _set, clayExport, clayImport } } = require('../migration-utils'),
    host = process.argv.slice(2)[0],
    componentUrl = 'clay.radio.com/_components/section-front/instances',
    // Inverse of Object.entries
    fromEntries = arr => arr.reduce((obj, [key, value]) => _set(obj, key, value), {});

// Since all migrations are run locally, and all upgrades are run on creation of a new component, there's a race condition
// locally where the podcastList is added by a migration after the upgrade moving it to mainContent
// 
// This migration will only be run locally to correct that difference
if (host === 'clay.radio.com') {
    clayExport({ componentUrl })
        .then(({ data }) => {
            // Get the list of section-front instances
            const instances = Object.entries(_get(data, '_components.section-front.instances'))
                .map(([instance, data]) => {
                    const { includePodcastModule, podcastList, ...restOfData } = data;

                    if (includePodcastModule && podcastList) {
                        const index = restOfData.mainContent.findIndex(({ _ref }) => _ref.includes('google-ad-manager'));

                        restOfData.mainContent.splice(index + 1, 0, podcastList);
                    }

                    return [instance, restOfData];
                });

            _set(data, '_components.section-front.instances', fromEntries(instances));

            clayImport({ hostUrl: host, payload: data, publish: true })
        });
} else {
    console.log('Skipping migration: local only')
}
