const fs = require('fs'),
  host = process.argv.slice(2)[0],
  elasticsearchURL = process.argv.slice(2)[1],
  http = process.argv.slice(2)[2],
  {v1: {httpGet, httpRequest}} = require('../migration-utils');

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

const getSettings = async (latestIndex) => {
  const settings = await httpGet({url: `${elasticsearchURL}/${latestIndex}/_settings`, http}).then(JSON.parse),
    newSettings = {settings: {analysis: settings[latestIndex].settings.index.analysis}}

  return newSettings;
}

const getAndUpdateElasticsearchMapping = async (latestIndex) => {
  const resp = await httpGet({url: `${elasticsearchURL}/${latestIndex}/_mappings`, http}).then(JSON.parse).catch(err => console.log(err)),
    mappings = resp[latestIndex].mappings;

  if (mappings._doc.properties.corporateSyndication) {
    return;
  }

  const newMappings = {mappings: {
    ...mappings, _doc: {
      ...mappings._doc,
      properties: {
        ...mappings._doc.properties,
        corporateSyndication: {type: 'keyword', fields: {normalized: {type: 'text', analyzer: 'station_analyzer'}}}
      }
    }
  }};

  return newMappings;
}

const createNewElasticsearchIndex = async (newIndex, body) => {
  try {
    const response = await httpRequest({http, method: 'PUT', url: `${http}://${elasticsearchURL}/${newIndex}`, body})
  } catch (e) {
    console.log(e);
  }
}

const update = async () => {
  const currentIndex = await getCurrentIndex(),
    {latestIndex, newIndex} = await getLatestIndex(),
    settings = await getSettings(latestIndex),
    mappings = await getAndUpdateElasticsearchMapping(latestIndex);

  if (mappings) {
    console.log({...mappings})
    await createNewElasticsearchIndex(newIndex, {...settings, ...mappings})
    console.log({latestIndex, newIndex})
  }
}

update();