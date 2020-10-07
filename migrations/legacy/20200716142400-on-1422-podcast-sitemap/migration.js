'use strict';
const {
    executeSQL,
    getFileText,
    parseHost,
    usingDb,
    DEFAULT_HEADERS,
  } = require('../migration-utils').v1,
  axios = require('../../../app/node_modules/axios'),

  divider = '\n' + '-'.repeat(80) + '\n',
  host = process.argv[2],
  {url} = parseHost(host); // should happen after migration-utils is imported

const logHeading = text => console.log(`\n${divider}${text}${divider}`);

const loadingDots = () => {
  const P = [".   ", "..  ", "... ", "...."];
  let x = 0;
  const timer = setInterval(function() {
    process.stdout.write("\r" + P[x++]);
    x &= 3;
  }, 250);
  return()=>{
    clearTimeout(timer)
    console.log('\n');
  }
};

const start = async () => {

  logHeading('Ensuring \'podcasts\' table exists')

  await usingDb(async db => {
    await db.query(`
            CREATE TABLE IF NOT EXISTS podcasts (
              id text PRIMARY KEY,
              data jsonb
            )
            `);
  });

  console.log('podcasts table exists');

  logHeading('Updating podcasts in db')

  const endDots = loadingDots();


  if (host !== 'clay.radio.com') {
    await axios.post(url + '/update-db-podcast-data', {}, {
      headers: DEFAULT_HEADERS
    }).catch((e) => {
      console.log('\nError updating podcasts:', e.message);
    })
  }

  endDots();

  console.log('Podcasts updated.');

  logHeading('Creating materialized view for podcasts sitemap.');
  const podcastSql = await getFileText(`${__dirname}/sql/sitemap_podcasts.sql`)
  await executeSQL(podcastSql);
  console.log('Script Executed.\nFinished creating materialized view for podcasts.');


  console.log(`Done updating data for podcasts sitemap.${divider}`);
};

start()
  .catch(error => console.error(
    'An unexpected problem occurred when updating podcasts sitemap.',
    error
  ));
