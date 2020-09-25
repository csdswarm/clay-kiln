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
  // fetch section-front pages that use the `general` meta-tags instance
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE data->'main'->>0 ~ 'podcast-front-page'`,
    result = await db.query(query);

  return result.rows.filter(({ id }) => id.startsWith(host))
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
      })).filter(({ data, id }) => !data.main.stationSlug && id !== `${host}/_pages/podcast-front`);

      const nationalPodcastFrontMetaTitle = `${host}/_components/meta-title/instances/national-podcast-front`,
        nationalPodcastFrontMetaDescription = `${host}/_components/meta-description/instances/national-podcast-front`,
        metaTitleData = {
          "title": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "ogTitle": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "kilnTitle": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "defaultTitle": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "defaultOgTitle": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "defaultKilnTitle": "RADIO.COM: Listen to Free Radio | Music, Sports, News, Podcasts",
          "componentVariation": "meta-title"
        },
        metaDescriptionData = {
          "description": "Welcome to RADIO.COM where you can listen to free radio online. Subscribe to the latest music news, sports news, and podcasts.",
          "componentVariation": "meta-description",
          "defaultDescription": "Welcome to RADIO.COM where you can listen to free radio online. Subscribe to the latest music news, sports news, and podcasts.",
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
