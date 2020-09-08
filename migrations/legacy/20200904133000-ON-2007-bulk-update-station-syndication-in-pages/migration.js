'use strict'

const
  axios = require('../../../app/node_modules/axios'),
  utils = require('../migration-utils'),

  // NOTE: CONCURRENCY and PAUSE are currently arbitrary, but I felt it would be safer.
  CONCURRENCY = 1000,
  PAUSE = 500,
  SQL = `WITH
    _main (id, syndication) as (
     SELECT id, data-> 'stationSyndication' FROM components.article UNION
     SELECT id, data-> 'stationSyndication' FROM components.gallery
    ),
    _page (id, main) as (
       SELECT id, data->'main'->>0 FROM public.pages
    )
    SELECT REPLACE(p.id, '@published', '') id, m.syndication::text
    FROM _page p
        LEFT JOIN _main m ON p.main = m.id
    WHERE p.id ~ '@published$'
      AND m.syndication #> '{0,callsign}' IS NOT NULL`, // only applies to station syndication that follows the new model

  { _chunk } = utils.v1,
  {
    parseHost,
    usingDb
  } = utils.v3,

  bulkUpdateEs = (data, es) => axios({
    method: 'POST',
    url: `${es.http}://${es.hostname}:${es.port}/pages/_doc/_bulk`,
    headers: { 'Content-Type': 'application/x-ndjson' },
    data
  });

// So, I could have probably found a way to get the data above directly from elastic, but elastic is not really easy to
// deal with when trying to join indexes (tables, ...whatever), but postgres makes this very easy and straightforward,
// so this script grabs the data from the article/gallery and unites it with the page id from postgres, then runs a
// bulk update on elastic with this data.

async function updatePages() {
  const { env, es } = await parseHost();

  await usingDb(env, async db => {
    try {
      console.log('Getting data from postgres');
      const { rows } = await db.query(SQL);
      const toAction = row => `{ "update": { "_id": "${row.id}", "retry_on_conflict": 3 }}\n` +
                              `{ "doc": { "stationSyndication": ${row.syndication} } }\n`;

      const bulkActions = _chunk(rows.map(toAction), CONCURRENCY).map(rows => rows.join(''));

      console.log('Updating elastic');
      process.stdout.write('\x1b[1;92m'); //bold green;
      for(const actionsSet of bulkActions) {
        const response = await bulkUpdateEs(actionsSet, es);

        if(response.status >= 300) {
          console.log('There might have been an issue updating the index:');
          console.log('actionsSet:', actionsSet);
          console.log(JSON.stringify({ response }));
        } else {
          process.stdout.write('.'.repeat(Math.floor(actionsSet.split(/\n/g).length/2)));
        }
        // Not certain if this wait is needed, but I don't want to chance overloading elastic with the thousands of rows
        // we may potentially be updating.
        await new Promise(resolve => setTimeout(resolve, PAUSE));
      }
      process.stdout.write('\x1b[0m'); // reset

    } catch (error) {
      console.error({error})
    }
  })
}

console.log('Updating elastic page indexes with corresponding stationSyndications');
updatePages().then(() => console.log('\n\ndone\n\n'));
