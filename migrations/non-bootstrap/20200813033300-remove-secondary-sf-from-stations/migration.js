'use strict';

const { isArray } = require('util');

const { clayExport, clayImport } = require('../../utils/migration-utils').v1,
  { esQuery } = require('../../utils/migration-utils').v2,
  { v1: parseHost } = require('../../utils/parse-host'),

  _get = require('lodash/get'),

  fs = require('fs'),
  nationalMappingFile = 'national-mappings.json',
  republishPageUris = require('../utils/republish-page-uris').v1,
  usingDb = require('../../legacy/using-db').v1,
  
  host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host);

run();

async function run() {
  try {
    const migratedStations = await getMigratedStations(envInfo),
      secondarySFMappings = await getSecondarySFMappings(),
      secondarySectionFronts = getSecondarySFList(migratedStations, secondarySFMappings),
      [[ {listToUpdate, listToRemove} ]] = await getListsToAddAndRemove(secondarySectionFronts);
      
    await updateArticles(listToRemove);
    await updateSecondarySectionFronts(listToUpdate);

  } catch (error) {
    console.log('run error', error);
  }
}

async function getSecondarySFMappings() {
  const url = 'https://etm-radiostations.s3.us-east-1.amazonaws.com/secondary-section-fronts-mapping.json',
    responseMapping = await fetch(url);
      
  return responseMapping.json();
}

async function getMigratedStations(envInfo) {
  try {
    const result = await esQuery(
      { size: 100 },
      {
        ...envInfo.es,
        index: 'published-stations',
        logError: true
      }
    );

    return _get(result, 'hits.hits', []).map(({ _source }) => _source.stationSlug);
  } catch (_err) {
    // the error was already logged so we just need to return early
    return;
  }
}

function getSecondarySFList(migratedStations, secondarySFMappings) {
  const secondarySectionFronts = {};

  migratedStations.map((stationSlug) => {
    if (secondarySFMappings[stationSlug]) {
      const secondarySFFront = secondarySFMappings[stationSlug],
        stationSSFront = `${stationSlug}-secondary-section-fronts`;

      Object.values(secondarySFFront).map((value) => {
        const secondarySectionFront = { name: value, value: value.toLowerCase() };

        addItemsToObject(secondarySectionFronts, stationSSFront, secondarySectionFront)
      });
    }
  })

  return secondarySectionFronts;
}

async function getDifferenceBetweenLists(secondarySectionFronts) {
  let listDifferences = {};

  return Promise.all(Object.keys(secondarySectionFronts)
    .map(async (item) => {
      let data;

      try {
        data = await clayExport({ componentUrl: `${host}/_lists/${item}` });
      } catch(e) {
        console.log('_list error', e)
      }

      const list = _get(data, `data._lists.${item}`, []),
        newList = _get(secondarySectionFronts, item),
        listDifference = list.filter(({ value: id1 }) => !newList.some(({ value: id2 }) => id2 === id1));

      if (listDifference.length > 0) {
        addItemsToObject(listDifferences, item, listDifference);
      }

      return listDifferences;
    })
  )
}

function getSecondaryNationalMapping() {
  const nationalMapping = fs.readFileSync(nationalMappingFile, 'utf-8'),
    parsedNatMapping = JSON.parse(nationalMapping),
    secondaryNatMapping = _get(parsedNatMapping, 'secondary.national', null),
    mapping = Object.values(secondaryNatMapping).map((value) => value.toLowerCase());

  return mapping;
}

function addItemsToObject(secondarySectionFronts, stationSSFront, secondarySectionFront) {
  return secondarySectionFronts[stationSSFront]
    ? isArray(secondarySectionFront)
      ? secondarySectionFronts[stationSSFront] = [...secondarySectionFronts[stationSSFront], ...secondarySectionFront]
      : secondarySectionFronts[stationSSFront].push(secondarySectionFront)
    : isArray(secondarySectionFront)
      ? secondarySectionFronts[stationSSFront] = secondarySectionFront
      : secondarySectionFronts[stationSSFront] = [secondarySectionFront];
}

async function getListsToAddAndRemove(listToUpdate) {
  const [ listDifferences ] = await getDifferenceBetweenLists(listToUpdate),
    secondaryNatMapping = getSecondaryNationalMapping(),
    listToRemove = [];

  return Promise.all(Object.entries(listDifferences)
    .map(([key, values]) => {
      return Promise.all(values.map(async (row) => {
        if (secondaryNatMapping.filter((secondary) => secondary === row.value).length > 0) {
          const isThereASectionFront = await getSecondarySFFromValue(row),
            index = values.indexOf(row),
            stationSlug = key.replace('-secondary-section-fronts', '');

          if (!isThereASectionFront) {
            listToRemove.push({...row, stationSlug});
            values.splice(index, 1);
          }
          return { listToUpdate, listToRemove };
        }
      }))
    })
  )
}

async function updateArticles(lists) {
  return Promise.all(lists.map(async (list) => {
    const hits = getPublishedContent(list);

    _get(hits, 'hits', []).map(async (article) => {
      const url = article._id,
        { data } = await clayExport({ componentUrl: url });

      return Promise.all(Object.entries(_get(data, '_components.article.instances', {}))
        .map(async ([_, value]) => {
          _set(value, 'secondarySectionFront', '')

          try {
            await clayImport({ payload: data, hostUrl: host });
            await republishArticles(url);

          } catch (e) {
            console.log('db error', e);
          }
        })
      )
    })
  })
  )
}

async function getPublishedContent(list) {
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
            },
            {
              "match": {
                "stationSlug": list.stationSlug
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

  return hits;
}

async function republishArticles(contentURI) {
  const query = `SELECT p.id
      FROM pages p
      WHERE data#>>'{main,0}' = '${contentURI}'`,
    pageUris = [];

  await usingDb(async db => {
    const uri = await db.query(query).then(results => _get(results, 'rows[0].id'))
    
    pageUris.push(uri);
  });

  return republishPageUris(pageUris, envInfo);
}

async function updateSecondarySectionFronts(secondarySectionFronts) {
  const payload = {
    _lists: secondarySectionFronts
  };

  return clayImport({ payload, hostUrl: host });
};

async function getSecondarySFFromValue(row) {
  const query = `SELECT id, data
    FROM components."section-front"
    WHERE data->>'title' = '${row.name}'
    AND (data->>'primary')::boolean IS false
    AND id ~ '@published$'`;

  let sectionFronts;
  await usingDb(async db => {
    sectionFronts = await db.query(query).then(results => _get(results, 'rows'))
  });

  if (sectionFronts.length > 0) {
    return true;
  } else {
    return false;
  }
}
