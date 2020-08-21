'use strict';

const { clayImport, clayExport, _set, readFile } = require('../../utils/migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  { esQuery } = require('../../utils/migration-utils').v2,
  { v1: parseHost } = require('../../utils/parse-host'),
  republishPageUris = require('../utils/republish-page-uris').v1,
  usingDb = require('../../legacy/using-db').v1,
  _get = require('lodash/get'),
  envInfo = parseHost(hostUrl),
  INCLUDES = [
    'music',
    'news',
    'small-business-pulse',
    'sports',
    'station-front-3',
    'im-listening',
    '1thing',
    'station-basic-music',
    'new'
  ];

const
  run = async () => {
    try {
      const secondarySectionFronts = {},
        stationsSlug = [];

      const instances = await getSectionFrontInstances(),
        mapping = await getSecondarySFMapping();

      await Promise.all(instances.map(async (instance) => {
        let sectionFronts;
        try {
          sectionFronts = await clayExport({ componentUrl: instance });
        } catch (error) {
          console.log('section front error', error);
        }

        Object.entries(_get(sectionFronts, 'data._components.section-front.instances', {}))
          .forEach(([_, { primary, title, stationSlug }]) => {
            if (!primary && title && title != '' && stationSlug) {
              const secondarySectionFront = { name: title, value: title.toLowerCase() },
                stationSSFront = `${stationSlug}-secondary-section-fronts`;

              if (!mapping[stationSlug] && secondarySectionFront.value != '') {
                secondarySectionFronts[stationSSFront]
                  ? secondarySectionFronts[stationSSFront].push(secondarySectionFront)
                  : secondarySectionFronts[stationSSFront] = [secondarySectionFront];
              } else if (mapping[stationSlug] && !stationsSlug.includes(stationSSFront)) {
                stationsSlug.push(stationSSFront);
              }
            }
          });
      }));

      Object.entries(mapping)
        .forEach(([stationSlug, values]) => {
          const stationSSFront = `${stationSlug}-secondary-section-fronts`;

          Object.values(values)
            .forEach((value, _) => {
              const secondarySectionFront = { name: value, value: value.toLowerCase() };

              if (stationsSlug.includes(stationSSFront)) {
                secondarySectionFronts[stationSSFront]
                  ? secondarySectionFronts[stationSSFront].push(secondarySectionFront)
                  : secondarySectionFronts[stationSSFront] = [secondarySectionFront];    
              }
            })
        })
      await getSecondarySectionFrontsList(secondarySectionFronts);
      await updateSecondarySectionFronts(secondarySectionFronts);
    } catch (e) {
      console.log('error', e);
    }
  },

  getSecondarySectionFrontsList = async (secondarySectionFronts) => {
    return Promise.all(Object.keys(secondarySectionFronts)
      .map(async (item) => {
        let data;
        try {
          data = await clayExport({ componentUrl: `${hostUrl}/_lists/${item}` });
        } catch(e) {
          console.log('_list error', e)
        }

        const list = _get(data, `_lists.${item}`, []),
          newList = _get(secondarySectionFronts, item),
          listDifference = list.filter(({ value: id1 }) => !newList.some(({ value: id2 }) => id2 === id1));

        if (listDifference.length > 0) {
          await updateArticles(listDifference);
        }
      })
    )
  },

  checker = value => !INCLUDES.some(element => value.includes(element)),

  getSectionFrontInstances = async () => {
    const 
      res = await fetch(`http://${hostUrl}/_components/section-front/instances`),
      response = await res.json();

    return response.filter(checker)
  },

  getSecondarySFMapping = async () => {
    const secondarySFMapping = 'https://etm-radiostations.s3.us-east-1.amazonaws.com/secondary-section-fronts-mapping.json',
      responseMapping = await fetch(secondarySFMapping);
      
    return responseMapping.json();
  },

  updateArticles = async (lists) => {
    return Promise.all(lists.map(async (list) => {
      const query = {
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "contentType": "article"
                }
              },
              {
                "match": {
                  "secondarySectionFront": list.value
                }
              }
            ]
          }
        },
        "size": 1
      },
        { hits } = await esQuery(
          query,
          {
            ...envInfo.es,
            index: 'published-content',
            logError: true
          }
        );

      _get(hits, 'hits', []).map(async (article) => {
        const url = article._id,
          { data } = await clayExport({ componentUrl: url });

        return Promise.all(Object.entries(_get(data, '_components.article.instances', {}))
          .map(async ([_, value]) => {
            _set(value, 'secondarySectionFront', '')

            try {
              await clayImport({ payload: data, hostUrl });
              await republishArticles(url);

            } catch (e) {
              console.log('db error', e);
            }
          })
        )
      })
    })
    )
  },

  republishArticles = async (contentURI) => {
    const query = `SELECT p.id
        FROM pages p
        WHERE data#>>'{main,0}' = '${contentURI}'`,
      pageUris = [];
  
    await usingDb(async db => {
      const uri = await db.query(query).then(results => _get(results, 'rows[0].id'))
      
      pageUris.push(uri);
    });

    await republishPageUris(pageUris, envInfo);
  },

  updateSecondarySectionFronts = async (secondarySectionFronts) => {
    const payload = {
      _lists: secondarySectionFronts
    };

    return clayImport({ payload, hostUrl });
  };

run()