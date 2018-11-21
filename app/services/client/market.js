'use strict';
const rest = require('../universal/rest'),
  geoApi = 'https://geo.radio.com/markets',
  nationalMarketID = 14,
  localStorageKey = 'market',
  market = localStorage.getItem(localStorageKey);

/**
 * Get the market from the geoAPI
 *
 * @returns {*}
 */
function getMarket() {
  if (!market) {
    return rest.get(geoApi).then(marketData => {
      let market = {
        id: nationalMarketID,
        name: ''
      };

      if (marketData.Markets.length > 0) {
        market = marketData.Markets[0];
      }

      localStorage.setItem('market', JSON.stringify(market)); // Store market in browser
      return market;
    });
  } else {
    return Promise.resolve(JSON.parse(market));
  }
}

/**
 * Get the id from the market
 *
 * @returns {Promise<*>}
 */
async function getID() {
  let market = await getMarket();

  return market.id;
}

/**
 * Get the name from the market
 * @returns {Promise<*>}
 */
async function getName() {
  let market = await getMarket();

  return market.name;
}

module.exports = {
  getID: getID,
  getName: getName
};
