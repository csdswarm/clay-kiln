'use strict';
const fs = require('fs'),
  host = process.argv[2],
  stationJSON = require('./station.json');

const DYNAMIC_META_IMAGE_INSTANCE = '/_components/dynamic-meta-image/instances/station';

const checkArrayForString = (arr, checkStr) => arr.some(str => str.includes(checkStr));

if (checkArrayForString(stationJSON.head, 'meta-image')) {
    stationJSON.head = stationJSON.head.filter(ref => !ref.includes('meta-image'));
}

stationJSON.head.push(`${host}${DYNAMIC_META_IMAGE_INSTANCE}`);

fs.writeFile(`${__dirname}/station.json`, JSON.stringify(stationJSON), function(err) {
    if (err) throw err;
  }
);
