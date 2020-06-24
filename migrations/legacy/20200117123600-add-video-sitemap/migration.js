'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const videos = await readFileAsync('./create-sitemap/videos.sql', 'utf8');

    await usingDb(db => db.query(videos));

    console.log("successfully created the videos sitemap");
  } catch (err) {
    console.error(err);
  }
}
