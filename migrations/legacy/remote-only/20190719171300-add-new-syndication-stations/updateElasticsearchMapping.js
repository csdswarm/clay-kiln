const fs = require('fs'),
  host = process.argv.slice(2)[0],
  elasticsearchURL = process.argv.slice(2)[1],
  http = 'http',
  {v1: {httpGet, httpRequest}} = require('../migration-utils'),
  headers = {
    'Content-Type': 'application/json'
  };

if (!host) {
  throw new Error('Missing host');
}

const getCurrentIndex = async () => {
  const resp = await httpGet({url: `${elasticsearchURL}/published-content/_alias`, http});

  const aliases = Object.keys(JSON.parse(resp));

  if (aliases.length > 1) {
    throw Error('Currently there are multiple aliases')
  }
  
  return aliases[0];
}

const getLatestIndex = async () => {
  const resp = await httpGet({url:`${elasticsearchURL}/_aliases`, http});
  let latestVersion;

  Object.keys(JSON.parse(resp)).forEach(key => {
    const match = key.match(/published-content_v(\d+)/);

    if (match) {
      const version = parseInt(match[1]);
      if (!latestVersion || version > latestVersion) {
        latestVersion = version;
        latestIndex = key
        newIndex = `published-content_v${version + 1}`
      }
    }
  });

  return {latestIndex, newIndex}
}

const getSettings = async (index) => {
  const settings = await httpGet({url: `${elasticsearchURL}/${index}/_settings`, http}).then(JSON.parse),
    newSettings = {settings: {analysis: settings[index].settings.index.analysis}}

  return newSettings;
}

const getAndUpdateElasticsearchMapping = async (index) => {
  console.log('getting elasticsearch mappings for', index, '\n');
  const resp = await httpGet({url: `${elasticsearchURL}/${index}/_mappings`, http}).then(JSON.parse).catch(err => console.log(err)),
    mappings = resp[index].mappings;

  if (mappings._doc.properties.corporateSyndication) {
    return;
  }

  const newMappings = {mappings: {
    ...mappings, _doc: {
      ...mappings._doc,
      properties: {
        ...mappings._doc.properties,
        corporateSyndication: {type: 'object', dynamic: true}
      }
    }
  }};

  return newMappings;
}

const createNewElasticsearchIndex = async (newIndex, body) => {
  console.log('Creating new elasticsearch index for', newIndex, '\n')
  const response = await httpRequest({http, method: 'PUT', url: `${elasticsearchURL}/${newIndex}`, body, headers});

  if (response.result !== 'success') {
    throw new Error(`There was an error creating the elasticsearch index for ${newIndex}`);
  }
 }

const reindex = async (latestIndex, newIndex) => {
  console.log('Reindexing based on new index\n')
  const response = await httpRequest({http, method: 'POST', url: `${elasticsearchURL}/_reindex`, body: {
    source: {
      index: latestIndex
    },
    dest: {
      index: newIndex
    }
  }, headers});
  
  if (response.result !== 'success') {
    throw new Error('There was an error reindexing');
  }
}

const addNewAlias = async (currentIndex, newIndex) => {
  console.log('adding new alias', newIndex, '\n')
  const response = await httpRequest({http, method: 'POST', url: `${elasticsearchURL}/_aliases`, body: {
    actions: [
      {remove: {index: currentIndex, alias: 'published-content'}},
      {add: {index: newIndex, alias: 'published-content'}}
    ]
  }, headers})
  
  if (response.result !== 'success') {
    throw new Error('here was an error adding a new alias for published-content');
  }
}

const update = async () => {
  const currentIndex = await getCurrentIndex(),
    {latestIndex, newIndex} = await getLatestIndex(),
    settings = await getSettings(currentIndex),
    mappings = await getAndUpdateElasticsearchMapping(currentIndex);

  if (mappings) {
    await createNewElasticsearchIndex(newIndex, {...settings, ...mappings})
    await reindex(currentIndex, newIndex);
    await addNewAlias(latestIndex, newIndex)
  } else {
    console.log(`The corporateSyndication field already exists on ${currentIndex}`);
  }
}

update();