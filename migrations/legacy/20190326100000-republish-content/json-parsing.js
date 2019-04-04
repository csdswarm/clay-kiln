'use strict';
const h = require('highland'),
  split = require('split-lines'),
  fs = require('fs'),
  writableStream = fs.createWriteStream(`${__dirname}/published-content-urls.txt`);

h(fs.createReadStream(`${__dirname}/published-content.txt`))
  .split()
  .compact()
  .map(line => {
    if (line) {
      var id = JSON.parse(line)._id;
      return id + '\n'
    }
  })
  .pipe(writableStream);
