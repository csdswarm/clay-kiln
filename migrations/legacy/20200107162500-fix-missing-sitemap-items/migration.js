'use strict';

const {
  getFileText,
  executeSQL,
  parseHost,
} = require('../migration-utils').v1;
const host = process.argv[2];
const { url } = parseHost(host); // should happen after migration-utils is imported

const start = async () => {
  const createAuthorsSitemapScript = createSitemapScript('authors');
  const createTopicsSitemapScript = createSitemapScript('topics');

  console.log('Updating materialized view for the authors sitemap.');
  await executeSQL(await createAuthorsSitemapScript());
  console.log('Finished updating materialized view for authors.');

  console.log('Updating materialized view for the topics sitemap.');
  await executeSQL(await createTopicsSitemapScript());
  console.log('Finished updating materialized view for topics.');
};

const createSitemapScript = name =>
  async () => (await getFileText(`${__dirname}/sql/${name}-sitemap.sql`))
     .replace(/{{baseUrl}}/g, url);

start()
  .catch(error => console.error(
    'An unexpected problem occurred when updating topic/author sitemaps.',
    error
  ));
