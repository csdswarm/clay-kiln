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
 * @param {object} locals
 * @returns {Promise<array>}
 */
function getAllMarkets(locals) {
  const route = 'markets',
    params = {
      'page[size]': 1000,
      sort: 'name'
    };

  return radioApiService.get(
    route,
    params,
    null,
    {
      amphoraTimingLabelPrefix: 'get all markets',
      shouldAddAmphoraTimings: true
    },
    locals
  )
    .then(response => {
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
 * @param {object} locals
 * @param {boolean} [newsTalk]
 * @returns {Promise<array>}
 */
function getAllGenres(locals, newsTalk = false) {
  const route = 'genres',
    params = {
      'page[size]': 100
    };

  if (newsTalk) {
    params['sort'] = 'name';
  }

  return radioApiService.get(
    route,
    params,
    null,
    {
      amphoraTimingLabelPrefix: 'get all genres',
      shouldAddAmphoraTimings: true
    },
    locals
  )
    .then(response => {
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

  [data.location, data.music, locals.allNewsTalk] = await Promise.all( [getAllMarkets(locals), getAllGenres(locals), getAllGenres(locals, true)]);
  locals.allMarkets = data.location;
  locals.allMusic = data.music;

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
