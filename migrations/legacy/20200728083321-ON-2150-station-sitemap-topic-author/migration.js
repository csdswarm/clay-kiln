'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const [stationAuthor, stationTopic] = await Promise.all([
      readFileAsync('./create-sitemap/station-author.sql', 'utf8'),
      readFileAsync('./create-sitemap/station-topic.sql', 'utf8')
    ]);

    await usingDb(db => Promise.all([
      db.query(stationAuthor),
      db.query(stationTopic)
    ]));

    console.log("successfully created the postgres station author and topic sitemap views");
  } catch (err) {
    console.error(err);
  }
}
