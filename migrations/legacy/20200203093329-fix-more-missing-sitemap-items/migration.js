'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const articlesAndGalleries = await readFileAsync('./articles-and-galleries-sitemap.sql', 'utf8');

    await usingDb(db => db.query(articlesAndGalleries));

    console.log('successfully updated the articles-and-galleries sitemap');
  } catch (err) {
    console.error(err);
  }
}
