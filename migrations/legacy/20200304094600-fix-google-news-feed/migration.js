'use strict';

const fs = require('fs'),
    hostUrl = process.argv[2] || 'clay.radio.com',
    googleNewsFeed = require('./googleNewsFeed.json');

delete googleNewsFeed.results;
googleNewsFeed.meta.link = hostUrl;

fs.writeFile(`${__dirname}/googleNewsFeed.json`, JSON.stringify(googleNewsFeed), function(err) {
    if (err) throw err;
  }
);