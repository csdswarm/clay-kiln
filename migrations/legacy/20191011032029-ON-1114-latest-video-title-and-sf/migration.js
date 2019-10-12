'use strict';

const { parseHost, DEFAULT_HEADERS } = require('../migration-utils').v1;

const  host = process.argv[2] || 'clay.radio.com';
const { url, message } = parseHost(host);
const latestVideosComponentUrl = `${url}/_components/latest-videos`;
const latestVideosHomePageInstUrl = `${latestVideosComponentUrl}/instances/homepage`;
const putOptions = { method: 'PUT', headers: { ...DEFAULT_HEADERS } };

const parseJson = res => res.json();

const addTitleToComponent = async url => {
  const body = JSON.stringify({
    title: 'Radio.com Videos', // put this before existing data to ensure we are not overwriting anything
    ...(await fetch(url).then(parseJson)),
  });

  return fetch(url, {...putOptions, body }).then(parseJson).catch(console.error);
};

const publish = async url => fetch(`${url}@published`, {...putOptions, body: null});

const run = async () => {
  console.log('\nAdding default title to existing latest-videos component');
  console.log(message);

  await addTitleToComponent(latestVideosComponentUrl);
  console.log('Added default title to main latest-videos component');

  await addTitleToComponent(latestVideosHomePageInstUrl);
  await publish(latestVideosHomePageInstUrl);
  console.log('Added default title to homepage instance of latest-videos');

  console.log('Finished updating latest-videos\n');
};

run().catch(console.error);
