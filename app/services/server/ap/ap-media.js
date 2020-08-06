'use strict';

const
  { getAll } = require('./ap-subscriptions'),
  { retrieveList } = require('../lists'),
  { uploadImage } = require('../s3'),
  { DAY } = require('../../universal/constants'),
  cache = require('../cache'),
  logger = require('../../universal/log'),
  rest = require('../../universal/rest'),

  apMediaKey = process.env.AP_MEDIA_API_KEY,
  log = logger.setup({ file: __filename }),
  MAX_CACHE_AP_IN_SECONDS = 3 * DAY / 1000,

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
  searchAp = async (filterConditions) => {
    if (typeof filterConditions !== 'string' || filterConditions === '') {
      __.log('error', 'filterConditions must be a string or have a value');
      return null;
    }
    const searchURL = 'https://api.ap.org/media/v/content/search?',
      sort = 'versioncreated:desc',
      API_URL = `${searchURL}apikey=${apMediaKey}&q=${filterConditions}&page_size=100&sort=${sort}`;

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
        endpoint = next_page.includes('?')
          ? `${next_page}&apikey=${apMediaKey}`
          : `${next_page}?apikey=${apMediaKey}`;
      } else {
        const entitlements = await __.retrieveList('ap-media-entitlements', Object.assign({ locals }, null)),
          entitlementsStr = entitlements.map(e => e.value).join(' OR '),
          includes = 'associations,headline_extended,meta.products,renditions.nitf,subject';

        endpoint = `${apFeedUrl}?q=productid%3A(${entitlementsStr})&page_size=${pageSize}&include=${includes}&apikey=${apMediaKey}`;
      }

      const { data: { items, next_page: nextPage } } = await __.rest.get(endpoint);

      await __.cache.set('ap-subscriptions-url', nextPage, MAX_CACHE_AP_IN_SECONDS);

      return items.map(({ item, meta: { products } }) => {
        return { item, products };
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
  saveApPicture = async (pictureEndpoint) => {
    try {
      if (!pictureEndpoint) {
        __.log('error', 'Missing pictureEndpoint');
        return null;
      }

      const endpoint = pictureEndpoint.includes('?') ?
          `${pictureEndpoint}&apikey=${apMediaKey}` :
          `${pictureEndpoint}?apikey=${apMediaKey}`,
        response = await __.rest.get(endpoint),
        item = response.data.item,
        { pubstatus, altids, headline } = item,
        alternateFileName = `ap-${altids.etag}-${item.renditions.main.originalfilename}`,
        imageUrl = `${item.renditions.main.href}&apikey=${apMediaKey}`,
        url = await __.uploadImage(imageUrl, { alternateFileName, noWait: false });

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
   * Make a request to return the article body
   * @param {string} nitfUrl
   * @return {object}
   */
  getApArticleBody = async (nitfUrl) => {
    try {
      if (!nitfUrl) {
        __.log('error', 'Not niftUrl was passed');
        return null;
      }

      const endpoint = nitfUrl.includes('?')
        ? `${nitfUrl}&apikey=${apMediaKey}`
        : `${nitfUrl}?apikey=${apMediaKey}`;
      
      return await __.rest.getHTML(endpoint);
    } catch (e) {
      __.log('error', 'Bad request getting article body', e);
      return {};
    }
  };

module.exports = {
  _internals: __,
  getApArticleBody,
  getApFeed,
  saveApPicture,
  searchAp
};
