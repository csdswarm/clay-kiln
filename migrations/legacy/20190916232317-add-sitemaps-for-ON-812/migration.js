'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const createSitemapView = await readFileAsync('./create-sitemap-view.sql', 'utf8');

    await usingDb(db => db.query(createSitemapView));

    console.log("successfully created the postgres view 'sitemap'");
  } catch (err) {
    console.error(err);
  }
}
