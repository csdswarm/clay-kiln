'use strict';

const path = require('path'),
  getNewComponentsYml = require('./get-new-components-yml'),
  v1Utils = require('../../utils/migration-utils').v1,
  { _get, clayImport, elasticsearch, parseHost } = v1Utils,
  shouldUpdate = mappings => {
    const props = mappings._doc.properties;

    return !props.msnTitleLength
      || !props.noIndexNoFollow
      || !_get(props, 'feeds.dynamic');
  },
  updateMappings = mappings => {
    const props = mappings._doc.properties;

    props.msnTitleLength = { type: 'integer' };
    props.noIndexNoFollow = { type: 'boolean' };
    props.feeds = Object.assign(props.feeds || {}, {
      type: 'object',
      dynamic: true
    });

    return mappings;
  };

run()

async function run() {
  try {
    console.log('running the migration for msn-feed');

    const host = process.argv[2] || 'clay.radio.com',
      envInfo = parseHost(host);

    await Promise.all([
      importNewComponents(host, envInfo.http),
      updateIndex(envInfo)
    ])

    console.log(
      'successfully imported the following component instances'
      + '\n - feeds/msn'
      + '\n - feed-image/new'
    );
  } catch (err) {
    console.error(err);
  }
}

// helper fns

function importNewComponents(host, http) {
  const msnYml = getNewComponentsYml(host, http);

  return clayImport({
    hostUrl: host,
    payload: msnYml
  });
}

function updateIndex(envInfo) {
  return elasticsearch.updateIndex(
    envInfo,
    'published-content',
    {
      shouldUpdate,
      updateMappings
    }
  )
}
