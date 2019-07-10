'use strict';

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
          'awards', 'performance', 'tv', 'streaming', 'digitalvideo', 'film', 'unrelatedentertainment', 'pop', 'rock', 'alternative', 'hiphop-r&b', 'country', 'classicrock', 'latino'
        ];
        break;
      case SPORTS:
        options = [
          'nfl', 'nhl', 'mlb', 'nba', 'ncaafootball', 'ncaabasketball', 'mma-wwe', 'tennis', 'golf', 'soccer', 'unrelatedsports'
        ];
        break;
      case NEWS_LIFESTYLE:
        options = [
          'national', 'lasvegas', 'international', 'losangeles', 'austin', 'madison', 'baltimore', 'memphis', 'boston', 'miami', 'buffalo', 'milwaukee', 'charlotte', 'minneapolis', 'chattanooga', 'neworleans', 'chicago', 'newyork', 'cleveland', 'norfolk', 'dfw', 'orlando', 'denver', 'phoenix', 'detroit', 'philadelphia', 'gainesville', 'pittsburgh', 'greensboro', 'portland', 'greenville', 'providence', 'hartford', 'richmond', 'houston', 'riverside', 'indianapolis', 'rochester', 'kansascity', 'sacramento', 'lasvegas', 'sandiego', 'losangeles', 'sanfrancisco', 'madison', 'seattle', 'memphis', 'springfield', 'miami', 'stlouis', 'milwaukee', 'washingtondc', 'minneapolis', 'wichita', 'neworleans', 'wilkesbarre'
        ];
        break;
      default:
    }
    return options;
  };

module.exports.NEWS_LIFESTYLE = NEWS_LIFESTYLE;
module.exports.highLevelCategoryOptions = highLevelCategoryOptions;
module.exports.secondaryCategoryOptions = secondaryCategoryOptions;
module.exports.tertiaryCategoryOptions = tertiaryCategoryOptions;
