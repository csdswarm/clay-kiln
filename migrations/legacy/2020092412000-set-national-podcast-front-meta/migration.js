'use strict';

const { usingDb } = require('../migration-utils').v1,
  { parseHost } = require('../migration-utils').v2,
  { axios } = require('../../utils/base'),
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host),
  Promise = require('../../../app/node_modules/bluebird'),
  headers = {
    Authorization: 'token accesskey',
    'Content-Type': 'application/json'
  };

updatePodcastFrontsMeta()
  .catch(err => console.log(err));

async function getAllPodcastFrontPages(db, host) {
  // fetch podcast-front pages that have an empty `stationSlug` or doesn't have a 'stationSlug' at all (National podcast front)
  const query = `
    SELECT
      p.id, p.data
    FROM
      pages p
    JOIN components."podcast-front-page" pfp 
      ON p.data->'main'->>0 = pfp.id
    WHERE p.id !~ 'podcast-front'
    AND pfp.id like '${host}/%'
    AND (pfp.data->>'stationSlug' = '' OR pfp.data->>'stationSlug' is null)
      `,
    {rows} = await db.query(query);

  return rows;
}

async function updatePodcastFrontsMeta() {
  try {
    await usingDb(async db => {
      let pages = await getAllPodcastFrontPages(db, host);

      pages = await Promise.all(pages.map(async (page) => {
        const { data: main } = await axios.get(`${envInfo.http}://${page.data.main[0]}`, {headers});
        return {
          ...page,
          data: {
            ...page.data,
            main: {
              ...main,
              _self: page.data.main[0]
            }
          }
        }
      }));

      const nationalPodcastFrontMetaTitle = `${host}/_components/meta-title/instances/national-podcast-front`,
        nationalPodcastFrontMetaDescription = `${host}/_components/meta-description/instances/national-podcast-front`,
        metaTitle = "Listen & Download on Any Device | RADIO.COM",
        metaTitleData = {
          "title": metaTitle,
          "ogTitle": metaTitle,
          "kilnTitle": metaTitle,
          "defaultTitle": metaTitle,
          "defaultOgTitle": metaTitle,
          "defaultKilnTitle": metaTitle,
          "componentVariation": "meta-title"
        },
        metaDescription = "Find your favorite podcast and listen on any device for free on the RADIO.COM app. Browse our huge collection of podcasts by category, or let us find you one.",
        metaDescriptionData = {
          "description": metaDescription,
          "componentVariation": "meta-description",
          "defaultDescription": metaDescription,
        };

      await Promise.all([
        axios.put(`${envInfo.http}://${nationalPodcastFrontMetaTitle}`, metaTitleData, { headers }).catch(err => console.log(err)),
        axios.put(`${envInfo.http}://${nationalPodcastFrontMetaDescription}`, metaDescriptionData, { headers }).catch(err => console.log(err)),
      ]);

      pages.forEach(async ({ id, data }) => {
        try {
          const head = new Set(data.head); // Ensure it doesn't get duplicated

          head.add(nationalPodcastFrontMetaTitle);
          head.add(nationalPodcastFrontMetaDescription);

          await axios.put(`${envInfo.http}://${id}`, {
            ...data,
            head: Array.from(head),
            main: [data.main._self]
          }, {headers})
        } catch (e) {
          console.error(e.response);
        }
      });
    })
  } catch (error) {
    console.log('error', error);
  }
}
