'use strict';
const radioApiService = require('../../services/server/radioApi'),
  slugifyService = require('../../services/universal/slugify'),
  SPORTS_SLUG = 'sports',
  NEWS_SLUG = 'news',
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
    }
    return [];
  });
}

/**
 * fetch all music genres from
 * radio api into an array
 * @param {boolean} newsTalk
 * @returns {Promise<array>}
 */
function getAllGenres(newsTalk) {
  const route = 'genres',
    params = {
      'page[size]': 100
    };
  
  if (newsTalk) {
    params['sort'] = 'name';
  }

  return radioApiService.get(route, params).then(response => {
    if (response.data) {
      const onlyMusicGenres = genre => ![SPORTS_SLUG, NEWS_SLUG, NEWSTALK_SLUG].includes(genre.attributes.slug),
        onlyNewsTalkGenres = genre => [NEWS_SLUG, NEWSTALK_SLUG].includes(genre.attributes.slug),
        addSlugAttribute = data => {
          data.attributes.slug = slugifyService(data.attributes.name);
          return data;
        };

      return response.data
        .filter(newsTalk ? onlyNewsTalkGenres : onlyMusicGenres)
        .map(addSlugAttribute);
    }
    return [];
  });
}

module.exports.render = async (uri, data, locals) => {
  if (!locals) {
    return data;
  }

  data.location = locals.allMarkets = await getAllMarkets();
  data.music = locals.allMusic = await getAllGenres();
  locals.allNewsTalk = await getAllGenres(true);
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
