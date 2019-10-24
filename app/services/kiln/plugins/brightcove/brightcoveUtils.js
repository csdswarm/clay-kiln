'use strict';
require('isomorphic-fetch');

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
  categoriesCache = {
    musicEntertainmentSecondary: [],
    sportsSecondary: [],
    newsLifestyleSecondary: [],
    allTertiary: []
  },
  /**
   * Gets secondary categories from _lists
   * or provide fallback categories
   *
   * @param {string} endpoint
   * @param {string[]} fallbackCategories
   * @param {string} cacheKey
   * @returns {string[]}
   */
  getCategoriesFromList = async (endpoint, fallbackCategories, cacheKey) => {
    if (categoriesCache[cacheKey].length) {
      return categoriesCache[cacheKey];
    }

    const { status, data } = await getFetchResponse('GET', `${ window.location.origin }/_lists/${ endpoint }`);

    let categories = [];

    if (status >= 200 && status < 300) {
      categories = data;
    } else {
      categories = fallbackCategories;
    }

    categoriesCache[cacheKey] = categories;

    return categories;
  },
  /**
   * Gets all secondary & tertiary categories from _lists
   *
   */
  getAllCategoryOptions = async () => {
    await Promise.all([
      getCategoriesFromList('brightcove_music_entertainment_secondary_categories', [
        'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment',
        'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
      ], 'musicEntertainmentSecondary'),
      getCategoriesFromList('brightcove_sports_secondary_categories', [
        'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf',
        'soccer', 'unrelatedsports'
      ], 'sportsSecondary'),
      getCategoriesFromList('brightcove_news_lifestyle_secondary_categories', [
        'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'bosto.n',
        'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork',
        'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville',
        'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston',
        'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles',
        'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee',
        'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
      ], 'newsLifestyleSecondary'),
      getCategoriesFromList('brightcove_tertiary_categories', [
        'food', 'drink', 'travel', 'home', 'health', 'environment'
      ], 'allTertiary')
    ]);
  },
  /**
   * Return secondary category options based on selected
   * high level category
   *
   * @param {string} highLevelCategory
   * @returns {string[]}
   */
  secondaryCategoryOptions = async highLevelCategory => {
    const categoryMap = {
      MUSIC_ENTERTAINMENT: categoriesCache.musicEntertainmentSecondary,
      SPORTS: categoriesCache.sportsSecondary,
      NEWS_LIFESTYLE: categoriesCache.newsLifestyleSecondary
    };

    return categoryMap[highLevelCategory] || [];
  },
  /**
   * Returns all tertiary categories
   *
   * @returns {string[]}
   */
  tertiaryCategoryOptions = () => {
    return categoriesCache.allTertiary;
  };

module.exports.AD_SUPPORTED = AD_SUPPORTED;
module.exports.FREE = FREE;
module.exports.INFO = INFO;
module.exports.ERROR = ERROR;
module.exports.SUCCESS = SUCCESS;
module.exports.NEWS_LIFESTYLE = NEWS_LIFESTYLE;
module.exports.getAllCategoryOptions = getAllCategoryOptions;
module.exports.highLevelCategoryOptions = highLevelCategoryOptions;
module.exports.secondaryCategoryOptions = secondaryCategoryOptions;
module.exports.tertiaryCategoryOptions = tertiaryCategoryOptions;
module.exports.getFetchResponse = getFetchResponse;
