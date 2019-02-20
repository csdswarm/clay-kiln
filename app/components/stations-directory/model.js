'use strict';
const radioApiService = require('../../services/server/radioApi'),
  SPORTS_SLUG = 'sports',
  NEWSTALK_SLUG = 'news-talk',
  url = require('url');

function getAllMarkets() {
  const route = 'markets',
    params = {'page[size]': 100};

  return radioApiService.get(route, params).then(response => {
    return response.data || [];
  });
}

function getAllMusicGenres() {
  const route = 'genres',
    params = {'page[size]': 100};

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      let musicGenres = response.data.filter(genre => {
        if (genre.attributes.slug !== SPORTS_SLUG && genre.attributes.slug !== NEWSTALK_SLUG) {
          return genre;
        }
      });

      return musicGenres;
    } else {
      return [];
    }
  });
}

module.exports.render = async (uri, data, locals) => {
  if (!locals) {
    return data;
  }

  data.location = await getAllMarkets();
  data.music = await getAllMusicGenres();
  let path = url.parse(locals.url).pathname;

  if (path.includes('location') || path.includes('music')) {
    path = path.replace(`/${path.split('/')[3]}`, '');
  }

  switch (path) {
    case '/stations/location':
      data.pageActive = 'location';
      break;
    case '/stations/music':
      data.pageActive = 'music';
      break;
    case '/stations/news-talk':
      data.pageActive = 'news-talk';
      break;
    case '/stations/sports':
      data.pageActive = 'sports';
      break;
    case '/stations':
    default:
      data.pageActive = 'featured';
      break;
  }

  return data;
};
