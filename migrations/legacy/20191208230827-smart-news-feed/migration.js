'use strict';

const path = require('path'),
  _get = require('../../../app/node_modules/lodash/get'),
  _set = require('../../../app/node_modules/lodash/set'),
  getSmartNewsYml = require('./get-smart-news-yml'),
  { v1: elasticsearch } = require('../../utils/elasticsearch'),
  { v1: parseHost } = require('../../utils/parse-host'),
  { v1: clayImport } = require('../../utils/clay-import'),
  shouldUpdate = mappings => {
    const props = mappings._doc.properties;

    return !props.noIndexNoFollow
      || !_get(props, 'feeds.properties.smartNews');
  },
  updateMappings = mappings => {
    const props = mappings._doc.properties;

    props.noIndexNoFollow = { type: 'boolean' };
    _set(props, 'feeds.properties.smartNews', { type: 'boolean' });

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
