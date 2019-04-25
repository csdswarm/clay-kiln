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

  return versionA - versionB;
});

console.log(versions[versions.length-1]);