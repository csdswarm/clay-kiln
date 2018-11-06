'use strict';
const rest = require('./rest'),
  geoApi = 'https://geo.radio.com/markets',
  nationalMarketID = 14,
  localStorageKey = 'market',
  market = localStorage.getItem(localStorageKey);

function getMarket() {
  if (!market) {
    return rest.get(geoApi).then(marketData => {
      if (marketData.Markets.length > 0) {
        localStorage.setItem('market', JSON.stringify(marketData.Markets[0])); // Store market in browser
      } else {
        localStorage.setItem('market', JSON.stringify({id: nationalMarketID})); // Store market in browser
      }

      return marketData.Markets;
    });
  } else {
    return Promise.resolve(market);
  }
}

async function getMarketID() {
  return await getMarket()['id'];
}


module.exports = {
  getMarket: getMarket,
  getMarketID: getMarketID
};
