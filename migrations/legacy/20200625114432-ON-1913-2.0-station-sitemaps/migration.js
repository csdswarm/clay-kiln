'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const [articlesAndGalleries, sectionFrontsAndHomepage] = await Promise.all([
      readFileAsync('./create-sitemap/articles-and-galleries.sql', 'utf8'),
      readFileAsync('./create-sitemap/section-fronts-and-homepage.sql', 'utf8')
    ]);

    await usingDb(db => Promise.all([
      db.query(articlesAndGalleries),
      db.query(sectionFrontsAndHomepage)
    ]));

    console.log("successfully created the postgres 2.0 sitemap views");
  } catch (err) {
    console.error(err);
  }
}
