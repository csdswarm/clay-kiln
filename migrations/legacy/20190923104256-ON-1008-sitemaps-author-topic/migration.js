'use strict';

const { textToEncodedSlug } = require('../../../app/services/universal/utils');
const {
  getFileText,
  executeSQL,
  executeSQLFile,
  executeSQLFileTrans,
  parseHost,
  prettyJSON,
} = require('../migration-utils').v1;
const host = process.argv[2];
const { url, message } = parseHost(host); // should happen after migration-utils is imported
const divider = '\n' + '-'.repeat(80) + '\n';
const DEBUG = false;

const heading = text => `\n${divider}${text}${divider}`;

const start = async () => {
  const getArticleGalleryAuthors = getData('article-gallery-authors');
  const updateArticleGalleryAuthors = updateData('article-gallery-authors');
  const createAuthorsSitemapScript = createSitemapScript('authors');
  const getTags = getData('tags');
  const updateTags = updateData('tags');
  const createTopicsSitemapScript = createSitemapScript('topics');

  console.log(heading('Updating data for topic and author sitemaps.'), message);

  console.log(heading('  Adding slugs to authors in articles and galleries'));

  console.log('Getting existing authors, first.');
  const authors = await getArticleGalleryAuthors();

  console.log('Got existing authors. Now adding slugs');
  const authorsWithSlugs = addAuthorSlugs(authors);

  console.log('Finished adding slugs. Now updating the DB.');
  await updateArticleGalleryAuthors(authorsWithSlugs);
  console.log('The DB was updated.', DEBUG);

  console.log(heading('  Creating materialized view for authors sitemap.'));
  const authorsSQL = await createAuthorsSitemapScript();
  console.log('created sitemap materialized view "script" for authors');

  await executeSQL(authorsSQL);
  console.log('Script Executed.\nFinished creating materialized view for authors.');

  console.log(heading('  Adding slugs to tags'));

  console.log('Getting existing tags first.');
  const tags = await getTags();

  console.log('Got existing tags. Now adding slugs.');
  const tagsWithSlugs = await addTagSlugs(tags);

  console.log('Finished adding slugs. Now updating the DB.');
  await updateTags(tagsWithSlugs);
  console.log('The DB was updated.');

  console.log(heading('  Creating materialized view for topics sitemap.'));
  const topicsSQL = await createTopicsSitemapScript();
  console.log('created sitemap materialized view "script" for topics');

  await executeSQL(topicsSQL);
  console.log('Script Executed.\nFinished creating materialized view for topics.');

  console.log(`Done updating data for topic and author sitemaps.${divider}`);
};

const getData = name => () => executeSQLFile(`${__dirname}/sql/${name}-get.sql`);

const updateData = name =>
  data => executeSQLFileTrans(`${__dirname}/sql/${name}-update.sql`, JSON.stringify(data));

const createSitemapScript = name =>
  async () => (await getFileText(`${__dirname}/sql/${name}-sitemap.sql`))
     .replace(/{{baseUrl}}/g, url);

const addSlug = obj => obj && ({ text: obj.text, slug: textToEncodedSlug(obj.text) });

const addAuthorSlugs = rows =>
  rows.map(obj => obj && ({
    id: obj.id,
    byline: obj.byline.map(item => item && ({...item, names: item.names.map(addSlug) })),
    authors: obj.authors.map(addSlug),
  }));

const addTagSlugs = rows =>
  rows.map(obj => obj && ({
    id: obj.id,
    items: obj.items.map(addSlug)
  }));


start()
  .catch(error => console.error(
    'An unexpected problem occurred when updating topic/author sitemaps.',
    error
  ));
