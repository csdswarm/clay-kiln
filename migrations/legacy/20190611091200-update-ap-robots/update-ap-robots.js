'use strict';

const
  { parseHost, clayExport, esQuery, clayImport, _get, _chunk, clone, prettyJSON } = require('../migration-utils').v1,
  host = process.argv[2],
  { es, url, message: envMessage } = parseHost(host),
  CHUNK_SIZE = 15, MAX_ARTICLES = 10000, DEFAULT_PAUSE = 25;


async function wait(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function getListOfComponentsWithAPSource() {
  const info = await esQuery({
    query: require('./query.json'),
    index: 'published-content',
    size: MAX_ARTICLES,
    ...es
  });
  return mapAsMetaTagUrls(info.data.hits.hits)
}

function mapAsMetaTagUrls(componentsList) {
  return componentsList.map(({ _id }) => _id
    .replace('@published', '')
    .replace('/article/', '/meta-tags/')
    .replace('/gallery/', '/meta-tags/')
  );
}

async function updateAllMetaTags(metaTagUrls) {
  const metaTagChunks = _chunk(metaTagUrls, CHUNK_SIZE);
  const totalChunks = metaTagChunks.length;
  for (const [index, chunk] of metaTagChunks.entries()) {
    console.log(`Processing next ${chunk.length} items. Set ${index + 1} of ${totalChunks}`);
    const metaTags = await getMetaTagsFromClay(chunk);
    const metaTagInstances = await mergeInstances(metaTags);
    const updates = await fixNoIndexNoFollow(metaTagInstances);
    const result = await applyUpdates(updates);
    await logResult(result);
  }
  console.log(`Done updating robots for AP.\n\n\n`);

}

async function getMetaTagsFromClay(metaTagUrls) {
  const metaTagData = [];

  // server might not appreciate getting too many simultaneous requests. Let's not
  // launch our own DOS attack. Put some time in between requests, but don't wait
  // for them to all get back right away either - CSD
  for (const componentUrl of metaTagUrls) {
    await wait(DEFAULT_PAUSE);
    const gotComponent = clayExport({ componentUrl })
      .catch(error => console.error(`Problem trying to get component: ${componentUrl}\n`, { error }));
    metaTagData.push(gotComponent)
  }

  // Here's where we will wait for everything that is in process to complete
  return await Promise.all(metaTagData);
}

function mergeInstances(metaTags) {
  return metaTags.reduce((
    obj,
    metaTag) => ({ ...obj, ..._get(metaTag, 'data._components.meta-tags.instances', {}) }),
    {})
}

function fixNoIndexNoFollow(metaTagInstances) {
  return Object.entries(metaTagInstances)
    .filter(entry => entry[1].noIndexNoFollow) // only fix it if it's broke
    .reduce((obj, [key, value]) => ({
      ...obj,
      [key]: { ...clone(value), noIndexNoFollow: true }
    }), {})
}

function applyUpdates(updates) {
  const payload = {
    _components: {
      'meta-tags': {
        instances: updates
      }
    }
  };

  return clayImport({ payload, hostUrl: url, publish: true });
}

function logResult(result) {
  if (result && result.result === 'success') {
    console.log('Successfully saved: \n  ' + result.messages.map(({ message }) => message).join('\n  '));
    return;
  }
  throw prettyJSON({ error: 'There was a problem saving in 20190611091200-update-ap-robots', result }) + '\n\n\n';
}

console.log('\n\nUpdating meta-tags for noIndexNoFollow on AP articles');
console.log(envMessage);

getListOfComponentsWithAPSource()
  .then(updateAllMetaTags)
  .catch(console.error)
;
