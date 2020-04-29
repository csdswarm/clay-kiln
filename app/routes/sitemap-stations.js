'use strict';

const radioApi = require('../services/server/radioApi'),
  slugifyService = require('../services/universal/slugify'),
  xml = require('xml');

module.exports = async function (req, res) {
  const baseUrl = `https://${req.headers.host}`,
    urlset = [
      { _attr: { xmlns: 'https://www.sitemaps.org/schemas/sitemap/0.9' } },
      { url: [{ loc: `${baseUrl}/stations` }] },
      { url: [{ loc: `${baseUrl}/stations/location` }] },
      { url: [{ loc: `${baseUrl}/stations/music` }] },
      { url: [{ loc: `${baseUrl}/stations/news-talk` }] },
      { url: [{ loc: `${baseUrl}/stations/sports` }] }
    ];

  // Location station directory pages
  await radioApi.get('markets', { page: { size: 1000 }, sort: 'name' }, null, {}, res.locals).then(function (markets) {
    markets.data.forEach(market => {
      urlset.push({
        url:
          [{
            loc: `${baseUrl}/stations/location/${slugifyService(market.attributes.display_name)}`
          }]
      });
    });
  });

  // Music station directory pages
  await radioApi.get('genres', { page: { size: 100 }, sort: 'name' }, null, {}, res.locals).then(function (genres) {
    genres.data.forEach(genre => {
      if (!['News & Talk', 'Sports'].includes(genre.attributes.name)) {
        urlset.push({
          url:
            [{ loc: `${baseUrl}/stations/music/${slugifyService(genre.attributes.name)}` }]
        });
      }
    });
  });

  // Station detail pages
  await radioApi.get('stations', { page: { size: 1000 }, sort: '-popularity' }, null, {}, res.locals).then(function (stations) {
    stations.data.forEach(station => {
      if (station.attributes.site_slug || station.attributes.callsign || station.id) {
        urlset.push({
          url:
              [{
                loc: `${baseUrl}/${station.attributes.site_slug || station.attributes.callsign || station.id}/listen`
              }]
        });
      }
    });
  });

  res.type('application/xml');
  return res.send(xml({ urlset }, { declaration: true }));
};
