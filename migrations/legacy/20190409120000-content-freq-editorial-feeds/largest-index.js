'use strict';

const host = process.argv.slice(2)[0],
  indices = process.argv.slice(3)[0];

if (!host) {
  console.log(process.argv);
  throw new Error('Missing host');
}

if (!indices) {
  console.log(process.argv);
  throw new Error('Missing indices');
}

const versions = indices.match(/published-content_v(\d+)/g);
if (!versions) {
  throw new Error('Cannot find any indices matching: published-content_v(\\d+)');
}

versions.sort((a,b) => {
  const versionA = parseInt(a.match(/published-content_v(\d+)/)[1]);
  const versionB = parseInt(b.match(/published-content_v(\d+)/)[1]);

  if (versionA > versionB) return 1;
  if (versionB > versionA) return -1;
  else return 0;
});

console.log(versions[versions.length-1]);