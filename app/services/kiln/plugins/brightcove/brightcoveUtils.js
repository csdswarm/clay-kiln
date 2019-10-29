'use strict';
require('isomorphic-fetch');

let categoriesCache = null;

const { getFetchResponse } = require('../utils/fetch'),
  AD_SUPPORTED = 'AD_SUPPORTED',
  FREE = 'FREE',
  INFO = 'info',
  ERROR = 'error',
  SUCCESS = 'success',
  MUSIC_ENTERTAINMENT = 'MUSIC_ENTERTAINMENT',
  SPORTS = 'SPORTS',
  NEWS_LIFESTYLE = 'NEWS_LIFESTYLE',
  highLevelCategoryOptions = [
    MUSIC_ENTERTAINMENT,
    SPORTS,
    NEWS_LIFESTYLE
  ],
  /**
   * Gets secondary categories from _lists
   * or provide fallback categories
   *
   * @param {string} endpoint
   * @param {string[]} fallbackCategories
   * @returns {string[]}
   */
  getCategoriesFromList = async (endpoint, fallbackCategories) => {
    const { status, data } = await getFetchResponse('GET', `${ window.location.origin }/_lists/${ endpoint }`);

    let categories = [];

    if (status >= 200 && status < 300) {
      categories = data;
    } else {
      categories = fallbackCategories;
    }

    return categories;
  },
  /**
   * Gets all secondary & tertiary categories from _lists, if not already retrieved.
   * @returns {Promise<Object>}
   */
  getAllCategoryOptions = () => {
    if (!categoriesCache) {
      // start loading categories from server
      categoriesCache = Promise.all([
        getCategoriesFromList('brightcove_music_entertainment_secondary_categories', [
          'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment',
          'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
        ]),
        getCategoriesFromList('brightcove_sports_secondary_categories', [
          'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf',
          'soccer', 'unrelatedsports'
        ]),
        getCategoriesFromList('brightcove_news_lifestyle_secondary_categories', [
          'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'bosto.n',
          'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork',
          'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville',
          'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston',
          'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles',
          'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee',
          'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
        ]),
        getCategoriesFromList('brightcove_tertiary_categories', [
          'food', 'drink', 'travel', 'home', 'health', 'environment'
        ])
      ]).then(([musicEntertainmentSecondary, sportsSecondary, newsLifestyleSecondary, allTertiary]) => ({
        musicEntertainmentSecondary,
        sportsSecondary,
        newsLifestyleSecondary,
        allTertiary
      })).catch(err => {
        categoriesCache = null;
        throw err;
      });
    }

    return categoriesCache;
  },
  /**
   * Return secondary category options based on selected
   * high level category
   *
   * @param {string} highLevelCategory
   * @returns {string[]}
   */
  secondaryCategoryOptions = async highLevelCategory => {
    const categories = await getAllCategoryOptions(),
      categoryMap = {
        MUSIC_ENTERTAINMENT: categories.musicEntertainmentSecondary,
        SPORTS: categories.sportsSecondary,
        NEWS_LIFESTYLE: categories.newsLifestyleSecondary
      };

    return categoryMap[highLevelCategory] || [];
  },
  /**
   * Returns all tertiary categories
   *
   * @returns {string[]}
   */
  tertiaryCategoryOptions = async () => {
    const categories = await getAllCategoryOptions();

    return categories.allTertiary;
  };

module.exports.AD_SUPPORTED = AD_SUPPORTED;
module.exports.FREE = FREE;
module.exports.INFO = INFO;
module.exports.ERROR = ERROR;
module.exports.SUCCESS = SUCCESS;
module.exports.NEWS_LIFESTYLE = NEWS_LIFESTYLE;
module.exports.highLevelCategoryOptions = highLevelCategoryOptions;
module.exports.secondaryCategoryOptions = secondaryCategoryOptions;
module.exports.tertiaryCategoryOptions = tertiaryCategoryOptions;
module.exports.getFetchResponse = getFetchResponse;
