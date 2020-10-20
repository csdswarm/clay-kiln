'use strict';

/**
 * CLI to help migration of curated pages from one env to another for a specific station
 *
 * Example:
 *
 * PGUSER=<> \
 * PGHOST=<> \
 * PGPASSWORD=<> \
 * PGDATABASE=<> node migrate-content-env-to-env preprod-clay.radio.com www.radio.com wearechannelq
 */
const{ bluebird, _ } = require('../../utils/base'),
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

  const fromEnvHttp = parseHost(fromEnv).http,
    toEnvHttp = parseHost(toEnv).http,
    headers = { 
      Authorization: 'token accesskey',
      'Content-Type': 'application/json'
    },
    pageTypes = [
      'section-front',
      'station-front',
      'topic-page',
      'static-page',
      'event',
      'events-listing-page',
      'contest',
      'author-page',
      'podcast-front-page',
      'host-page'
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
  public.pages.id NOT LIKE '%@published'
  AND components."page-type".data->>'stationSlug' = '${stationSlug}'
`;

  await usingDb(async db => {
    const query = pageTypes.map(pageType => {
      return queryForPageType.replace(/page-type/g, pageType)
    }).join(`
UNION
`),
      replaceHostDeep = object => {
        const newObject = _.clone(object);

        _.each(object, (value, key) => {
          if (typeof value === 'string' && value.includes(fromEnv)) {
            newObject[key] = value.replace(new RegExp(`https*://${fromEnv}`, 'g'), `${toEnvHttp}://${toEnv}`);
          } else if (typeof value === 'object') {
            newObject[key] = replaceHostDeep(value);
          }
        });

        return newObject;
      },

      getURLFromPageData = pageData => {
        const pageDataObjValues = _.values(pageData._pages)[0],
          pickedURLObj = _.pick(pageDataObjValues, 'url');
        
        return _.get(pickedURLObj, 'url');
      },

      recursiveImport = async (pageData, numTried = 0, maxTries = 3) => {
        return clayImport({
            payload: pageData,
            hostUrl: `${toEnvHttp}://${toEnv}`,
            publish: true
          })
          .then(importResult => importResult)
          .catch(async e => {
            const updatedNumTried = numTried + 1;
            const limiter = 100;
            
            await new Promise(resolve => setTimeout(resolve, limiter));
            
            if (updatedNumTried < maxTries) {
              return recursiveImport(pageData, updatedNumTried, maxTries);
            }
            
            console.error('Import step failed:', e.error);
            return null;
          });
      },

      transformCustomUrlToUrl = async (id, pageData) => {
        // check if any customUrls -> change to url
        const newID = id.replace(fromEnv, toEnv).replace('@published',''),
        { data } = await axios.get(`${toEnvHttp}://${newID}`);

        if (data.customUrl) {
          delete data.customUrl;
          data.url = getURLFromPageData(pageData);
          await axios.put(`${toEnvHttp}://${newID}`, data, { headers });
          await axios.put(`${toEnvHttp}://${newID}@published`, {}, { headers });
        }
      },

      portStationTheme = async () => {
        const { data } = await axios.get(`${fromEnvHttp}://${fromEnv}/station-theme/${stationSlug}`);
        let themeExistsInToEnv;

        const pageRecords = await db.query(query);
        await bluebird.map(
          pageRecords.rows,
          async pageRecord => {
            const { id } = pageRecord;
            try {
              await axios.get(`${toEnvHttp}://${toEnv}/station-theme/${stationSlug}`);
              themeExistsInToEnv = true;
            } catch (e) {
              themeExistsInToEnv = false;
            }
            const options = {
                method: themeExistsInToEnv ? 'PUT' : 'POST',
                headers,
                data,
                url: `${toEnvHttp}://${toEnv}/station-theme/${stationSlug}`
              };
              
            return axios(options)
              .then(({ status, data: updatedData }) => {
                if (status === 200) console.log('station theme updated to ', updatedData);
              })
              .catch(e => console.error('station theme was not updated', e.stack));
          }
        )
      },

      pageRecords = await db.query(query);
    
    try {
      await bluebird.map(
        pageRecords.rows,
        async pageRecord => {
          const { id } = pageRecord;
          
          clayExport({ componentUrl: id })
            .catch(e => console.log('Failed to export', id, e))
            .then(exportedPage => replaceHostDeep(exportedPage.data))
            .catch(e => console.log('Failed to replace host', id, e))
            .then(async pageData => { return { pageData, importResult: await recursiveImport(pageData) } })
            .catch(e => console.log('Failed to import', id, e))
            .then(async ({ pageData, importResult }) => {
              if (importResult) {
                await transformCustomUrlToUrl(id, pageData);
              }
            })
            .catch(e => console.log('Failed to transform custom url to url', id, e));
        },
        { concurrency: 2 }
      );

      await portStationTheme();
    } catch (e) {
      console.error(e.stack);
    }
  });
}
