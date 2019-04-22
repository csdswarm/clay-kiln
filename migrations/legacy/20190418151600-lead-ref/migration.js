'use strict';

const _ = require('highland');

function transform(doc) {
  console.log('HELLO:', doc._id);

  return doc;
}

_(process.stdin)
  .split()
  .map(JSON.parse)
  .map(transform)
  .map(JSON.stringify)
  .each(_.log);