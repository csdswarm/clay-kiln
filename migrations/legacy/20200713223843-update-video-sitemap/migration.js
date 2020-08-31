'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile),
  addDurationSeconds = require('./add-duration-seconds');

run()

async function run() {
  try {
    const updateVideoSitemap = await readFileAsync('./update-sitemap/videos.sql', 'utf8');

    await usingDb(db => Promise.all([
      addDurationSeconds(db),
      db.query(updateVideoSitemap)
    ]));

    console.log('successfully updated the videos sitemap and brightcove durations');
  } catch (err) {
    console.error(err);
  }
}
