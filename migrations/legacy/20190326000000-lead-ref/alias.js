'use strict';

const aliasesJSON = require(`${__dirname}/aliases.json`),
  host = process.argv.slice(2)[0];

if (!host) {
  throw new Error('Missing host');
}

const keys = Object.keys(aliasesJSON);
if (keys.length != 1) {
  throw new Error('Currently there are multiple aliases');
}

console.log(keys[0]);
