'use strict';
require('isomorphic-fetch');

const MUSIC_ENTERTAINMENT = 'MUSIC_ENTERTAINMENT',
  SPORTS = 'SPORTS',
  NEWS_LIFESTYLE = 'NEWS_LIFESTYLE',
  highLevelCategoryOptions = [
    MUSIC_ENTERTAINMENT,
    SPORTS,
    NEWS_LIFESTYLE
  ],
  tertiaryCategoryOptions = [
    'food', 'drink', 'travel', 'home', 'health', 'environment'
  ],
  /**
   * Get secondary category options based on selected
   * high level category
   * @param {string} highLevelCategory
   * @returns {string[]}
   *
   */
  secondaryCategoryOptions = highLevelCategory => {
    let options = [];

    switch (highLevelCategory) {
      case MUSIC_ENTERTAINMENT:
        options = [
          'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment',
          'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
        ];
        break;
      case SPORTS:
        options = [
          'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf', 'soccer', 'unrelatedsports'
        ];
        break;
      case NEWS_LIFESTYLE:
        options = [
          'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'boston',
          'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork', 'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville', 'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston', 'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles', 'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee', 'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
        ];
        break;
      default:
    }
    return options;
  },
  /**
   * Returns request's response status and JSON
   * using fetch
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
          data = headers && headers['Content-Type'] === 'application/json' ? await response.json() : null,
          { status, statusText } = response;
          
        return { status, statusText, data };
      }
    } catch (e) {
      return { status: 500, statusText: e, data: e };
    }
  };

module.exports.NEWS_LIFESTYLE = NEWS_LIFESTYLE;
module.exports.highLevelCategoryOptions = highLevelCategoryOptions;
module.exports.secondaryCategoryOptions = secondaryCategoryOptions;
module.exports.tertiaryCategoryOptions = tertiaryCategoryOptions;
module.exports.getFetchResponse = getFetchResponse;
