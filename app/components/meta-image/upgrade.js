'use strict';

const db = require('amphora-storage-postgres'),
  _get = require('lodash/get');

module.exports['1.0'] = async function (uri, data) {
  if (data.imageUrl) {
    return data;
  }

  try {
    const sql = `
          SELECT data->'main'->>0 as uri
          FROM public.pages
          WHERE data->>'head' ~ '${uri}'
      `,
      mainComponentUri = await db.raw(sql).then(results => _get(results, 'rows[0].uri')),
      mainComponent = await db.get(mainComponentUri);

    return {
      imageUrl: mainComponent.feedImgUrl
    };
  } catch (e) {
    console.error(e.message);
    return data;
  }
};

module.exports['2.0'] = (uri, data) => {
  data.imageUrl = data.imageUrl || '';

  return data;
};

module.exports['3.0'] = (uri, data) => {
  data.defaultImageUrl = data.imageUrl || '';
};
