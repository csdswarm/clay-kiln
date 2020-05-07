'use strict';
const fs = require('fs'),
  host = process.argv[2],
  stationJSON = require('./stations-directory.json');

const DYNAMIC_META_TITLE_INSTANCE = '/_components/dynamic-meta-title/instances/stations-directory',
    DYNAMIC_META_DESCRIPTION_INSTANCE = '/_components/dynamic-meta-description/instances/stations-directory';

stationJSON.head = stationJSON.head.filter(ref => !ref.includes('meta-title') && !ref.includes('meta-description'));

stationJSON.head.push(`${host}${DYNAMIC_META_TITLE_INSTANCE}`);
stationJSON.head.push(`${host}${DYNAMIC_META_DESCRIPTION_INSTANCE}`);

fs.writeFile(`${__dirname}/stations-directory.json`, JSON.stringify(stationJSON), function(err) {
    if (err) throw err;
  }
);
