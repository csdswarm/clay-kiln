'use strict';

const h = require('highland'),
  fs = require('fs'),
  writableStream = fs.createWriteStream(`${__dirname}/published-content-urls.txt`);

h(fs.createReadStream(`${__dirname}/published-content.txt`))
  .split()
  .compact()
  .map(line => {
    if (line) {
      return `${JSON.parse(line)._id}\n`
    }
  })
  .pipe(writableStream);
