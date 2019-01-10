'use strict';

const h = require('highland');

h(process.stdin)
  .split()
  .compact()
  .map(obj => {
    if (obj.indexOf('{"/_pages/') === 0) return obj.replace('"layout":"/_components/', '"layout":"/_layouts/');
    return obj;
  })
  .each(h.log)
