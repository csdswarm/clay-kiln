'use strict';

const { _has, _set, elasticsearch: es, parseHost } = require('../migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  apMapPath = '_doc.properties.ap.properties.itemid.type',
  separator = '-'.repeat(80);

(async () => {
  try {
    console.log('\n', separator);
    console.log('Starting ON-1983: Save AP Media Articles Migration\n');

    console.log('Adding', apMapPath, 'to published-content index');

    const index = await es.updateIndex(parseHost(hostUrl), 'published-content', {
      shouldUpdate: mappings => !_has(mappings, apMapPath) || console.log('Already Exists'),
      updateMappings: mappings => _set(mappings, apMapPath, 'keyword')
    });

    console.log(index ? 'Added' : 'Did not add', 'index', index || apMapPath );

  }
  catch(e) {
    console.error('A problem occurred when running ON-1983: Save AP Media Articles Migration\n');
    console.error(e);
  }
  finally {
    console.log('Finished ON-1983: Save AP Media Articles Migration\n', separator, '\n');
  }
})();
