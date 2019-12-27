'use strict';

const path = require('path'),
  _get = require('../../../app/node_modules/lodash/get'),
  _set = require('../../../app/node_modules/lodash/set'),
  getNewComponentsYml = require('./get-new-components-yml'),
  { v1: elasticsearch } = require('../../utils/elasticsearch'),
  { v1: parseHost } = require('../../utils/parse-host'),
  { v1: clayImport } = require('../../utils/clay-import'),
  shouldUpdate = mappings => {
    const props = mappings._doc.properties;

    return !props.msnTitleLength
      || !props.noIndexNoFollow
      || !_get(props, 'feeds.properties.msn');
  },
  updateMappings = mappings => {
    const props = mappings._doc.properties;

    props.msnTitleLength = { type: 'integer' };
    props.noIndexNoFollow = { type: 'boolean' };
    _set(props, 'feeds.properties.msn', { type: 'boolean' });

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
