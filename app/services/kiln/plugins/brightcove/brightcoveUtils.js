'use strict';
require('isomorphic-fetch');

let musicEntertainmentSecondaryCategories = [],
  sportsSecondaryCategories = [],
  newsLifestyleSecondaryCategories = [],
  allTertiaryCategories = [];
const AD_SUPPORTED = 'AD_SUPPORTED',
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
   * Returns request's response status and JSON
   * using fetch
   *
   * @param {string} method
   * @param {string} route
   * @param {any} body
   * @param {Object} headers
   * @returns {Object}
   *
   */
  getFetchResponse = async (method, route, body, headers) => {
    try {
      if (method === 'GET') {
        const response = await fetch(route),
          data = await response.json(),
          { status, statusText } = response;

        return { status, statusText, data };
      } else {
        const response = await fetch(route, {
            method,
            body: headers && headers['Content-Type'] === 'application/json' ? JSON.stringify(body) : body,
            headers: headers
          }),
          { status, statusText } = response;
          
        if (status >= 200 && status < 300) {
          const data = headers && headers['Content-Type'] === 'application/json'
            ? await response.json()
            : null;
        
          return { status, statusText, data };
        } else {
          return { status, statusText, data: statusText };
        }
      }
    } catch (e) {
      return { status: 500, statusText: e, data: e };
    }
  },
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
    
    if (status >= 200 && status < 300) {
      return data;
    } else {
      return fallbackCategories;
    }
  },
  /**
   * Gets all secondary & tertiary categories from _lists
   *
   */
  getAllCategoryOptions = async () => {
    musicEntertainmentSecondaryCategories = await getCategoriesFromList('brightcove_music_entertainment_secondary_categories', [
      'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment',
      'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
    ]);
    sportsSecondaryCategories = await getCategoriesFromList('brightcove_sports_secondary_categories', [
      'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf',
      'soccer', 'unrelatedsports'
    ]);
    newsLifestyleSecondaryCategories = await getCategoriesFromList('brightcove_news_lifestyle_secondary_categories', [
      'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'boston',
      'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork',
      'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville',
      'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston',
      'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles',
      'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee',
      'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
    ]);
    allTertiaryCategories = await getCategoriesFromList('brightcove_tertiary_categories', [
      'food', 'drink', 'travel', 'home', 'health', 'environment'
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
    let options = [];

    switch (highLevelCategory) {
      case MUSIC_ENTERTAINMENT:
        options = musicEntertainmentSecondaryCategories;
        break;
      case SPORTS:
        options = sportsSecondaryCategories;
        break;
      case NEWS_LIFESTYLE:
        options = newsLifestyleSecondaryCategories;
        break;
      default:
    }
    return options;
  },
  /**
   * Returns all tertiary categories
   *
   * @returns {string[]}
   */
  tertiaryCategoryOptions = () => {
    return allTertiaryCategories;
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
