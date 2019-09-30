'use strict';

const { textToEncodedSlug } = require('../../../app/services/universal/utils');
const {
  getFileText,
  executeSQL,
  executeSQLFile,
  executeSQLFileTrans,
  insertMessage,
  parseHost,
  prettyJSON,
} = require('../migration-utils').v1;
const host = process.argv[2];
const { url, message } = parseHost(host); // should happen after migration-utils is imported
const divider = '\n' + '-'.repeat(80) + '\n';
const DEBUG = false;

const start = async () =>
  console.log(`\n${divider}Updating data for topic and author sitemaps.${divider}`, message);

const getData = name => () => executeSQLFile(`${__dirname}/sql/${name}-get.sql`);

const updateData = name =>
  data => executeSQLFileTrans(`${__dirname}/sql/${name}-update.sql`, JSON.stringify(data));

const createSitemapScript = name =>
  async () => (await getFileText(`${__dirname}/sql/${name}-sitemap.sql`))
     .replace(/{{baseUrl}}/g, url);

const addSlug = ({ text }) => ({ text, slug: textToEncodedSlug(text) });

const addAuthorSlugs = rows =>
  rows.map(({id, byline, authors}) => ({
    id,
    byline: byline.map(item => ({...item, names: item.names.map(addSlug) })),
    authors: authors.map(addSlug),
  }));

const addTagSlugs = rows =>
  rows.map(({id, items}) => ({
    id,
    items: items.map(addSlug)
  }));

const finish = () =>
  console.log(`Done updating data for topic and author sitemaps.${divider}`);

start()
  .then(insertMessage(`${divider}  Adding slugs to authors in articles and galleries${divider}`))

  .then(insertMessage('Getting existing authors, first.'))
  .then(getData('article-gallery-authors'))
  .then(insertMessage('Got existing authors. Now adding slugs', DEBUG))
  .then(addAuthorSlugs)
  .then(insertMessage('Finished adding slugs. Now updating the DB.', DEBUG))
  .then(updateData('article-gallery-authors'))
  .then(insertMessage('The DB was updated.', DEBUG))

  .then(insertMessage(`${divider}  Creating materialized view for authors sitemap.${divider}`))

  .then(createSitemapScript('authors'))
  .then(insertMessage('created sitemap materialized view "script" for authors', DEBUG))
  .then(executeSQL)
  .then(insertMessage('Script Executed.\nFinished creating materialized view for authors.'))

  .then(insertMessage(`${divider}  Adding slugs to tags${divider}`))

  .then(insertMessage('Getting existing tags first.'))
  .then(getData('tags'))
  .then(insertMessage('Got existing tags. Now adding slugs.', DEBUG))
  .then(addTagSlugs)
  .then(insertMessage('Finished adding slugs. Now updating the DB.', DEBUG))
  .then(updateData('tags'))
  .then(insertMessage('The DB was updated.', DEBUG))

  .then(insertMessage(`${divider}  Creating materialized view for topics sitemap.${divider}`))

  .then(createSitemapScript('topics'))
  .then(insertMessage('created sitemap materialized view "script" for topics', DEBUG))
  .then(executeSQL)
  .then(insertMessage('Script Executed.\nFinished creating materialized view for topics.'))

  .then(finish)

  .catch(error => console.error(
    'An unexpected problem occurred when updating topic/author sitemaps.',
    prettyJSON({ error })
  ));
