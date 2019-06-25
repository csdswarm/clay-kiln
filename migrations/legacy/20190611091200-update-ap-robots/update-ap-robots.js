'use strict';

const
  fs = require('fs'),
  {
    parseHost, clayExport, esQuery, clayImport, httpGet,
    republish, _get, _chunk, clone, prettyJSON
  } = require('../migration-utils').v1,
  host = process.argv[2] || 'clay.radio.com',
  { es, url, http, message: envMessage } = parseHost(host),
  CHUNK_SIZE = 15, MAX_ARTICLES = 10000, DEFAULT_PAUSE = 25,
  METATAGS = 'meta-tags', ARTICLES = 'article', GALLERIES = 'gallery';

let errorLog;

async function wait(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function chunkUrls(urls) {
  return _chunk(urls, CHUNK_SIZE);
}

function logError(message, error) {
  const divider = '\n' + '-'.repeat(60) + '\n'
  console.error(message);
  console.error('See `errors.log` in migration folder (20190611091200-update-ap-robots) for more details');
  if (!errorLog) {
    fs.unlinkSync('./errors.log');
    errorLog = fs.createWriteStream('./errors.log', { flags: 'a' });
  }
  errorLog.write(`${divider}${message}${divider}`);
  try {
    errorLog.write(`${prettyJSON({ error })}${divider}`);
  } catch (e) {
    // handle cyclic dependency (won't show as detailed of an error, but may provide some useful info)
    errorLog.write(`${error}${divider}`);
  }
  console.log('\n\n');
}

async function getListOfComponentsWithAPSource() {
  const info = await esQuery({
    query: require('./query.json'),
    index: 'published-content',
    size: MAX_ARTICLES,
    ...es
  });
  return mapAsUnpublished(info.data.hits.hits)
}

function mapAsUnpublished(componentsList) {
  return componentsList.map(({ _id }) => _id.replace('@published', ''));
}

async function makeSureAllAreUpToDate(componentUrlChunks) {
  // goes through all the page urls for the articles/galleries we want to update and touches them, so that they
  // run through their upgrade scripts. That way, we will have meta-tags available to update.
  const allRequests = [];
  const badRequests = [];
  console.log(`Updating publish version of target components`);
  for (const chunk of componentUrlChunks) {
    for (const url of chunk) {
      try {
        // give a little pause to make sure that the server isn't overwhelmed.
        await wait(DEFAULT_PAUSE);
        // getting page based on article id (this will work for imported items but it's unlikely to work with
        // others), so if page does not exist, track which articles could not be updated this way and log them
        // so we can handle updating some other way if needed.
        const pageUrl = url.replace(/^.*\/instances\//, `${host}/_pages/`) + '.html';
        // don't really need anything back, just need to touch the target page, so it runs it's upgrades.
        allRequests.push(httpGet({ http, url: pageUrl })
          .then(() => console.log(`Ensured: ${http}://${pageUrl} is up-to-date`))
          .catch(error => {
            logError(`Problem upgrading ${http}://${pageUrl}, perhaps a different page is associated with ${url}`,
              { error })
            badRequests.push(url);
          }));
      } catch (error) {
        logError(`There was a problem publishing ${hostUrl}`, error);
      }
    }
  }
  // Do need to wait for these to be done before moving on.
  await Promise.all(allRequests);
  console.log('Done updating target components.\n\n');
  // Only return the articles for pages that worked. We don't want to partially update those that don't or they might
  // not be fixable until someone republishes manually
  return componentUrlChunks.filter(url => !badRequests.includes(url));
}

async function updateAllComponents(componentUrlChunks) {
  const totalChunks = componentUrlChunks.length;
  for (const [index, chunk] of componentUrlChunks.entries()) {
    console.log(`Updating next ${chunk.length} items. Set ${index + 1} of ${totalChunks}`);
    const components = await getComponentsFromClay(chunk);
    const updates = await mergeInstances(components);
    const result = await applyUpdates(updates);
    await logResult(result);
  }
  console.log(`Done updating robots for AP.\n\n\n`);
}

async function getComponentsFromClay(componentUrls) {
  const componentPromises = [];

  // server might not appreciate getting too many simultaneous requests. Let's not
  // launch our own DOS attack. Put some time in between requests, but don't wait
  // for them to all get back right away either - CSD
  for (const componentUrl of componentUrls) {
    const type = componentUrl.includes(ARTICLES) ? ARTICLES : GALLERIES;
    const metaTagUrl = componentUrl.replace(type, METATAGS);

    await wait(DEFAULT_PAUSE);
    const gotComponent = clayExport({ componentUrl })
      .catch(error => logError(`Problem trying to get component: ${componentUrl}`, error));
    const gotMetaTag = clayExport({ componentUrl: metaTagUrl })
      .catch(error => logError(`Problem trying to get component: ${metaTagUrl}`, error));
    componentPromises.push({
      type,
      promise: Promise.all([gotComponent, gotMetaTag])
    })
  }

  // Here's where we will wait for everything that is in process to complete
  return await Promise.all(componentPromises.map(async ({ type, promise }) => {
    const [componentData, metaTagData] = await promise;
    return { type, componentData, metaTagData };
  }))
}

function mergeByType(type, components) {
  const dataProp = type === METATAGS ? 'metaTagData' : 'componentData';

  return components
    .filter(c => type === METATAGS || c.type === type)
    .reduce((obj, component) => (
      { ...obj, ..._get(component[dataProp], `data._components.${type}.instances`, {}) }
    ), {})
}

function mergeInstances(components) {
  // likely to only be articles and meta-tags
  return {
    [ARTICLES]: { instances: fixNoIndexNoFollow(mergeByType(ARTICLES, components)) },
    [GALLERIES]: { instances: fixNoIndexNoFollow(mergeByType(GALLERIES, components)) },
    [METATAGS]: { instances: fixNoIndexNoFollow(mergeByType(METATAGS, components)) },
  };
}

function fixNoIndexNoFollow(componentInstances) {
  return Object.entries(componentInstances)
    .filter(entry => !entry[1].noIndexNoFollow) // only fix it if it's broke
    .reduce((obj, [key, value]) => ({
      ...obj,
      [key]: { ...clone(value), noIndexNoFollow: true }
    }), {})
}

async function republishAffectedPages(ids) {
  for (const id of ids) {
    republish({ hostname: host, http, path: `/_pages/${id}` })
      .catch(error => logError('Problem trying to republish:', { error }));
    await wait(DEFAULT_PAUSE);
  }
}

function applyUpdates(updates) {
  const payload = {
    _components: {
      ...updates,
    },
  };

  const result = clayImport({ payload, hostUrl: url, publish: true });

  result.then(() => republishAffectedPages(Object.keys(updates[METATAGS].instances)));

  return result;
}

function logResult(result) {
  if (result && result.result === 'success') {
    console.log('Successfully saved: \n  ' + result.messages.map(({ message }) => message).join('\n  '));
    return;
  }
  throw prettyJSON({ error: 'There was a problem saving in 20190611091200-update-ap-robots', result }) + '\n\n\n';
}

function listErrors() {
  if (errorLog) {
    errorLog.end();
    console.error(
      'Errors were encountered. Please see errors.log in migration 20190611091200-update-ap-robots for more detail')
  }
}

console.log('\n\nUpdating meta-tags for noIndexNoFollow on AP articles');
console.log(envMessage);

getListOfComponentsWithAPSource()
  .then(chunkUrls)
  .then(makeSureAllAreUpToDate)
  .then(updateAllComponents)
  .catch(error => logError(`Unhandled Errors:`, { error }))
  .then(listErrors)
;
