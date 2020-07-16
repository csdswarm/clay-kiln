'use strict';

const cache = require ('../cache'),
  domUtils = require('../dom-utils'),
  { getAll } = require('./ap-subscriptions'),
  logger = require('../../universal/log'),
  rest = require('../../universal/rest'),
  { retrieveList } = require('../lists'),
  { uploadImage } = require('../s3'),

  apMediaKey = process.env.AP_MEDIA_API_KEY,
  log = logger.setup({ file: __filename }),

  __ = {
    cache,
    getAll,
    log,
    rest,
    retrieveList,
    uploadImage
  },

  /**
   * Queries the ap-media search endpoint for recent articles that match a user query
   * @param {string} filterConditions
   * @return {array}
   */
  searchAp = async ( filterConditions ) => {
    if (typeof filterConditions !== 'string' || filterConditions === '') {
      __.log('error', 'filterConditions must be a string or have a value');
      return null;
    }
    const searchURL = 'https://api.ap.org/media/v/content/search',
      API_URL = `${searchURL}&apikey=${apMediaKey}?q=${filterConditions}&page_size=100`;

    try {
      const response = await __.rest.get(API_URL),
        items = response.data.items;
    
      return items.map(({ item }) => item);
    } catch (e) {
      __.log('error', 'Bad request getting data from search ap-media', e);
      return [];
    }
  },

  /**
   * Retrieves the latest feed info from ap-media
   * @param {object} locals
   * @return {array}
   */
  getApFeed = async (locals) => {
    try {
      const next_page = await __.cache.get('ap-subscriptions-url'),
        apFeedUrl = 'https://api.ap.org/media/v/content/feed',
        pageSize = 100;

      let endpoint;

      if (next_page) {
        endpoint = next_page.split('&').length === 1 ?
          `${next_page}&apikey=${apMediaKey}` :
          `${next_page}?apikey=${apMediaKey}`;
      } else {
        const entitlements = await __.retrieveList('ap-media-entitlements', Object.assign({ locals }, null)),
          entitlementsStr = entitlements.map(e => e.value).join(' OR '),
          includes = 'associations,headline_extended,meta.products,renditions.nitf,subject';
        
        endpoint = `${ apFeedUrl }?q=productid%3A(${ entitlementsStr })&page_size=${ pageSize }&include=${ includes }&apikey=${ apMediaKey }`;
      }
      const response = await __.rest.get(endpoint),
        items = response.data.items;
      
      return items.map(({ item, meta }) => {
        return { item, products: meta.products };
      });
    } catch (e) {
      __.log('error', 'Bad request getting ap feed from ap-media', e);
      return [];
    }
  },

  /**
   * Gets the picture metadata from ap-media to upload it to s3
   * @param {string} pictureEndpoint
   * @return {object}
   */
  saveApPicture = async ( pictureEndpoint ) => {
    try {
      if (!pictureEndpoint) {
        __.log('error', 'Missing pictureEndpoint');
        return null;
      }
      const endpoint = pictureEndpoint.split('&').length === 1 ?
          `${pictureEndpoint}&apikey=${apMediaKey}` :
          `${pictureEndpoint}?apikey=${apMediaKey}`,
        response = await __.rest.get(endpoint),
        item = response.data.item,
        url = await __.uploadImage(item.renditions.main.href),
        { pubstatus, altids, headline } = item;

      return {
        pubstatus,
        itemid: response.id,
        etag: altids.etag,
        headline,
        url
      };
    } catch (e) {
      __.log('error', 'Bad request saving ap picture', e);
      return {};
    }
    
  },

  /**
   * Make a request to get the article body and return the hedline and block portions
   * @param {string} nitfUrl
   * @return {object}
   */
  getApArticleBody = async ( nitfUrl ) => {
    try {
      if (!nitfUrl) {
        __.log('error', 'Not niftUrl was passed');
        return null;
      }
    
      const endpoint = nitfUrl.split('&').length === 1 ?
          `${nitfUrl}&apikey=${apMediaKey}` :
          `${nitfUrl}?apikey=${apMediaKey}`,

        response = await __.rest.getHTML(endpoint),
        doc = new domUtils.DOMParser().parseFromString(response, 'text/html'),
        hedline = doc.getElementsByTagName('hedline'),
        block = doc.getElementsByTagName('block');
    
      if (hedline.length > 0 && block.length > 0) {
        return { hedline: hedline[0], block: block[0] };
      } else {
        return {};
      }
    } catch (e) {
      __.log('error', 'Bad request getting article body', e);
      return {};
    }
  },

  /**
   * Retrieves the latest feed info from ap-media
   * @param {object} locals
   * @return {array}
   */
  importApSubscription = async (locals) => {
    try {
      const apFeed = await getApFeed(locals),
        apSubscriptions = await __.getAll();

      apFeed.forEach( feed => {
        let apImportData = '{';

        feed.meta.products.forEach(product => {
          apSubscriptions.forEach(subscription => {
            subscription.data.entitlements.forEach(entitlement => {
              if (product.id === entitlement.id) {
                if (!apImportData.includes(subscription.data.stationSlug)) {
                  apImportData += `"${subscription.data.stationSlug}" : ${JSON.stringify(subscription.data.mappings[0])},`;
                }
              }
            });
          });
        });

        if (apImportData.length > 1) {
          apImportData = apImportData.slice(0, -1) + '}';
        }
      });

      return true;

    } catch (e) {
      __.log('error', 'Bad request importing ap feed from ap-media', e);
      return [];
    }
  };

  

module.exports = {
  _internals: __,
  getApArticleBody,
  getApFeed,
  importApSubscription,
  saveApPicture,
  searchAp
};
