'use strict';
const {
    executeSQL,
    getFileText,
    parseHost,
    usingDb,
    DEFAULT_HEADERS,
  } = require('../migration-utils').v1,
  axios = require('axios'),

  divider = '\n' + '-'.repeat(80) + '\n',
  host = process.argv[2],
  {url, message} = parseHost(host); // should happen after migration-utils is imported

const logHeading = text => console.log(`\n${divider}${text}${divider}`);

const start = async () => {

  logHeading('Ensuring \'podcasts\' table exists')

  await usingDb(async db => {
    const result = await db.raw(`
            CREATE TABLE podcasts IF NOT EXISTS (
              id text PRIMARY KEY,
              data jsonb
            )
            `);
    console.log(result);
  });

  console.log('podcasts table exists');

  logHeading('Updating podcasts in db')

  const results = await axios.post(url + '/update-db-podcasts', {}, {
    headers: DEFAULT_HEADERS
  });

  if(results.status>=400){
    console.error('Error updating podcasts db',results)
  } else {
    console.log('podcasts updated');
  }

  logHeading('  Creating materialized view for podcasts sitemap.');
  const podcastSql = await getFileText(`${__dirname}/sql/sitemap_podcasts.sql`)
  await executeSQL(podcastSql);
  console.log('Script Executed.\nFinished creating materialized view for podcasts.');


  console.log(`Done updating data for podcasts sitemap.${divider}`);
};

start()
  .catch(error => console.error(
    'An unexpected problem occurred when updating topic/author sitemaps.',
    error
  ));
