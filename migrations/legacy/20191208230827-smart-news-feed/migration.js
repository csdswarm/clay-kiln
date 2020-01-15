'use strict';

const path = require('path'),
  getSmartNewsYml = require('./get-smart-news-yml'),
  v1Utils = require('../../utils/migration-utils').v1,
  { _get, clayImport, elasticsearch, parseHost } = v1Utils,
  shouldUpdate = mappings => {
    const props = mappings._doc.properties;

    return !props.noIndexNoFollow
      || !_get(props, 'feeds.dynamic')
  },
  updateMappings = mappings => {
    const props = mappings._doc.properties;

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
    console.log('running the migration for smart-news-feed');

    const host = process.argv[2] || 'clay.radio.com',
      envInfo = parseHost(host);

    await Promise.all([
      importNewComponents(host, envInfo.http),
      updateIndex(envInfo)
    ])

    console.log('successfully ran the smart-news-feed migration');
  } catch (err) {
    console.error(err);
  }
}

// helper fns

function importNewComponents(host, http) {
  const smartNewsYml = getSmartNewsYml(host, http);

  return clayImport({
    hostUrl: host,
    payload: smartNewsYml
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
