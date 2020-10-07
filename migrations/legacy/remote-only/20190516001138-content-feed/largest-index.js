'use strict';

const indices = process.argv.slice(2)[0];


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

const index = parseInt(versions.pop().match(/published-content_v(\d+)/)[1])+1;
console.log(`published-content_v${index}`);
