'use strict';

const indexPrefix = process.argv.slice(2)[0],
  indices = process.argv.slice(3)[0];

if (!indexPrefix) {
  console.log(process.argv);
  throw new Error('Missing indexPrefix');
}

if (!indices) {
  console.log(process.argv);
  throw new Error('Missing indices');
}

let indexRegexGlobal = new RegExp(`${indexPrefix}_v(\\d+)`, 'g');
let indexRegexSingle = new RegExp(`${indexPrefix}_v(\\d+)`, '');
const versions = indices.match(indexRegexGlobal);
if (!versions) {
  throw new Error(`Cannot find any indices matching: ${indexPrefix}_v(\\d+)`);
}

versions.sort((a,b) => {
  const versionA = parseInt(a.match(indexRegexSingle)[1]);
  const versionB = parseInt(b.match(indexRegexSingle)[1]);

  return versionA - versionB;
});

console.log(versions[versions.length-1]);
