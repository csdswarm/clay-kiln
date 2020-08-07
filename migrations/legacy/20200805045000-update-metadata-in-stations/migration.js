'use strict';

const { clayImport, clayExport, readFile, prettyJSON, _has, _set } = require('../../utils/migration-utils').v1,
  hostUrl = process.argv[2] || 'clay.radio.com',
  _get = require('lodash/get'),
  getStationBySiteSlug_v1 = require('../../utils/get-stations-site-slug').v1,
  RADIOCOM = 'RADIO.COM';

const
  getPages = async () => {
    try {
      const pages = await clayExport({ componentUrl: `${hostUrl}/_pages` });

      Object.entries(_get(pages, 'data._pages', []))
        .map(async ([_, data]) => {
          if(_get(data, 'main[0]').includes('station-front')) {
            const station = _get(data, 'main[0]'),
              title = _get(data, 'head[0]'),
              description = _get(data, 'head[1]');

            if (!station.includes('new') && !title.includes('station-basic-music') && !description.includes('station-basic-music')) { 
              const { _, data: stationFront } = await clayExport({ componentUrl: `${hostUrl + station}`});

              return await getStationData(stationFront, title, description);
            }
          }
        });
    } catch (e) {
      console.log('e', e);
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
      title = `${station.name} - ${station.slogan} | ${RADIOCOM}` 

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