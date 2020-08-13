'use strict';

const usingDb = require('../using-db').v1,
  fs = require('fs'),
  util = require('util'),
  readFileAsync = util.promisify(fs.readFile);

run()

async function run() {
  try {
    const [articlesAndGalleries, authors, topics] = await Promise.all([
      readFileAsync('./articles-and-galleries-sitemap.sql', 'utf8'),
      readFileAsync('./authors-sitemap.sql', 'utf8'),
      readFileAsync('./topics-sitemap.sql', 'utf8'),
    ]);

    await usingDb(db => Promise.all([
      db.query(articlesAndGalleries),
      db.query(authors),
      db.query(topics)
    ]));

    console.log('successfully updated the articles-and-galleries sitemap');
    console.log('successfully updated the authors sitemap');
    console.log('successfully updated the topics sitemap');
  } catch (err) {
    console.error(err);
  }
}
