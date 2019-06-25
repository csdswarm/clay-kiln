'use strict';

const aliases = process.argv.slice(2)[0];

if (!aliases) {
  throw new Error('Missing aliases');
}

const aliasesJSON = JSON.parse(aliases);
const keys = Object.keys(aliasesJSON);

if (keys.length != 1) {
  throw new Error('Currently there are multiple aliases');
}

const index = keys[0];
const alias = Object.keys(aliasesJSON[index].aliases)[0];

console.log(`${index},${alias}`);
