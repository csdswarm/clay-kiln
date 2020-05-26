'use strict';

/**
 * CLI to help migration of curated pages from one env to another for a specific station
 *
 * Example:
 *
 * PGUSER=<> \
 * PGHOST=<> \
 * PGPASSWORD=<> \
 * PGDATABASE=<> node run preprod-clay.radio.com www.radio.com wearechannelq
 */
const { bluebird } = require('../../utils/base'),
  usingDb = require('../../utils/using-db').v2,
  clayExport = require('../../utils/clay-export').v1,
  clayImport = require('../../utils/clay-import').v1,
  fromEnv = process.argv.slice(2)[0],
  toEnv = process.argv.slice(3)[0],
  stationSlug = process.argv.slice(4)[0];

run()

async function run() {
  // Check for starting environment
  if (!fromEnv) {
    console.error('Error: Missing environment to pull content from');
    process.exit(1);
  }
  // Check for ending environment
  if (!toEnv) {
    console.error('Error: Missing environment to push content to');
    process.exit(1);
  }
  // Check for station
  if (!stationSlug) {
    console.error('Error: Missing station to pull content of');
    process.exit(1);
  }

  const pageTypes = [
    'section-front',
    'station-front',
    'gallery',
    'topic-page',
    'static-page',
    'event',
    'events-listing-page',
    'contest',
    'author-page'
  ],
  queryForPageType = `
SELECT
  public.pages.id
FROM
  components."page-type"
JOIN
  public.pages
ON
  public.pages.data->'main'->>0 = components."page-type".id
WHERE
  public.pages.id LIKE '%@published'
  AND components."page-type".data->>'stationSlug' = '${stationSlug}'
`;

  await usingDb(async db => {
    const query = pageTypes.map(pageType => {
      return queryForPageType.replace(/page-type/g, pageType)
    }).join(`
UNION
`);

    const pageRecords = await db.query(query);
    await bluebird.map(
      pageRecords.rows,
      async pageRecord => {
        let { id } = pageRecord;
        await clayExport({ componentUrl: id })
          .then(async exportedPage => {
            await clayImport({
              payload: exportedPage.data,
              hostUrl: toEnv === 'clay.radio.com' ?
                  `http://${toEnv}`
                : `https://${toEnv}`,
              publish: true
            })
              .then(result => {
                if (result.result === 'fail') {
                  console.log(result);
                }
              })
              .catch(e => console.error(e));
          })
          .catch(e => console.error(e));
      },
      { concurrency: 2 }
    );
  });
}
