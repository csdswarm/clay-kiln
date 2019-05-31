'use strict';

const aliasesJSON = require(`${__dirname}/aliases.json`),
  indexPrefix = process.argv.slice(2)[0];

if (!indexPrefix) {
  throw new Error('Missing indexPrefix');
}

const keys = Object.keys(aliasesJSON);
if (keys.length != 1) {
  throw new Error('Currently there are multiple aliases');
}

console.log(keys[0]);
