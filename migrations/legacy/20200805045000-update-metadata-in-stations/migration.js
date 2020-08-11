'use strict';

const { clayImport, clayExport, _set } = require('../../utils/migration-utils').v1,
  { esQuery } = require('../../utils/migration-utils').v2,
  { v1: parseHost } = require('../../utils/parse-host'),
  hostUrl = process.argv[2] || 'clay.radio.com',
  _get = require('lodash/get'),
  getStationBySiteSlug_v1 = require('../../utils/get-stations-site-slug'),
  RADIOCOM = 'RADIO.COM',
  envInfo = parseHost(hostUrl);


const
  getPages = async () => {
    try {
      const migratedStations = await esQuery(
        {},
        {
          ...envInfo.es,
          index: 'published-stations',
          logError: true
        }
      );

      _get(migratedStations, 'hits.hits', []).map(async ({ _source }) => {
        const { stationSlug } = _source,
          pages = await clayExport({ componentUrl: `${hostUrl}/${stationSlug}` });
        
        Object.entries(_get(pages, 'data._pages', []))
          .map(async ([_, data]) => {
            const station = _get(data, 'main[0]');
          
            if(station.includes('station-front')) {
              const [ title, description ] = _get(data, 'head', []);

              if (!station.includes('new') && !title.includes('station-basic-music') && !description.includes('station-basic-music')) { 
                const { _, data: stationFront } = await clayExport({ componentUrl: `${hostUrl + station}`});

                return await getStationData(stationFront, title, description);
              }
            }
          });
      });
    } catch (e) {
      console.log('error', e);
    }
  },

  getStationData = async (stationFront, title, description) => {
    Object.entries(_get(stationFront, '_components.station-front.instances', {}))
      .map(async ([_, { stationSlug }]) => {
        const station = await getStationBySiteSlug_v1(stationSlug);

        await Promise.all([
          updateMetaTitle(title, station),
          updateMetaDescription(description, station)
        ])
      })
  },

  updateMetaDescription = async (metaDescription, station) => {
    const { data: payload } = await clayExport({ componentUrl: `${hostUrl}${metaDescription}`}),
      [instance] = Object.keys(_get(payload, '_components.meta-description.instances', {}));

    _set(
      payload,
      `_components.meta-description.instances.${instance}.defaultDescription`,
      station.description
    );

    return clayImport({ hostUrl, payload, publish: true });
  },

  updateMetaTitle = async (metaTitle, station) => {
    const { data: payload } = await clayExport({ componentUrl: `${hostUrl}${metaTitle}`}),
      [instance] = Object.keys(_get(payload, '_components.meta-title.instances', {})),
      title = `${station.name} - ${station.slogan} | ${RADIOCOM}`;

    _set(
      payload,
      `_components.meta-title.instances.${instance}.defaultTwitterTitle`,
      title
    );

    _set(
      payload,
      `_components.meta-title.instances.${instance}.defaultOgTitle`,
      title
    );

    _set(
      payload,
      `_components.meta-title.instances.${instance}.defaultKilnTitle`,
      title
    );

    _set(
      payload,
      `_components.meta-title.instances.${instance}.defaultTitle`,
      title
    );
    
    return clayImport({ hostUrl, payload, publish: true });
  };

getPages()