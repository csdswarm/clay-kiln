'use strict';

const fs = require('fs'),
    googleNewsFeed = require('./googleNewsFeed.json'),
    hostUrl = process.argv[2] || 'clay.radio.com';

googleNewsFeed.meta.link = hostUrl;

fs.writeFile(`${__dirname}/googleNewsFeed.json`, JSON.stringify(googleNewsFeed), function(err) {
    if (err) throw err;
  }
);