'use strict';
const radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
  SPORTS_SLUG = 'sports',
  NEWSTALK_SLUG = 'news-talk',
  url = require('url');

/**
 * fetch all markets from
 * radio api into an array
 * @returns {Promise<array>}
 */
function getAllMarkets() {
  const route = 'markets',
    params = {
      'page[size]': 100,
      sort: 'name'
    };

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      return response.data.map(data => {
        data.attributes.slug = slugifyService(data.attributes.display_name);
        return data;
      });
    } else {
      return [];
    }
  });
}

/**
 * fetch all music genres from
 * radio api into an array
 * @returns {Promise<array>}
 */
function getAllMusicGenres() {
  const route = 'genres',
    params = {
      'page[size]': 100
    };

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      const onlyMusicGenres = response.data.filter(genre => {
        if (genre.attributes.slug !== SPORTS_SLUG && genre.attributes.slug !== NEWSTALK_SLUG) {
          return genre;
        }
      });

      return onlyMusicGenres.map(data => {
        data.attributes.slug = slugifyService(data.attributes.name);
        return data;
      });
    } else {
      return [];
    }
  });
}

module.exports.render = async (uri, data, locals) => {
  if (!locals) {
    return data;
  }

  data.location = locals.allMarkets = await getAllMarkets();
  data.music = locals.allMusic = await getAllMusicGenres();
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
