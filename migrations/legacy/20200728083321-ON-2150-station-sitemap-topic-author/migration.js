'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);
const {
  parseHost,
} = require('../migration-utils').v1;
const host = process.argv[2];
const { url } = parseHost(host); // should happen after migration-utils is imported

run()

function transformBaseUrl(query) {
  return query.replace(/{{baseUrl}}/g, url);
}

async function run() {
  try {
    const [stationAuthor, stationTopic] = (await Promise.all([
      readFileAsync('./create-sitemap/station-author.sql', 'utf8'),
      readFileAsync('./create-sitemap/station-topic.sql', 'utf8')
    ])).map(transformBaseUrl);

    await usingDb(db => Promise.all([
      db.query(stationAuthor),
      db.query(stationTopic)
    ]));

    console.log("successfully created the postgres station author and topic sitemap views");
  } catch (err) {
    console.error(err);
  }
}
