'use strict';

const { uploadImage } = require('../s3'),
  rest = require('../../universal/rest'),
  cache = require ('../cache'),
  logger = require('../../universal/log'),
  domUtils = require('../dom-utils'),

  apMediaKey = process.env.AP_MEDIA_API_KEY,
  log = logger.setup({ file: __filename }),
  searchURL = 'https://api.ap.org/media/v/content/search',
  _ = {
    rest,
    searchURL,
    cache,
    uploadImage
  },

  searchAp = async ( filterConditions ) => {
    if (typeof filterConditions !== 'string' && filterConditions !== '') {
      log('error', 'filterConditions must be a string');
      return null;
    }
    const API_URL = `${_.searchURL}&apikey=${apMediaKey}?q=${filterConditions}&page_size=100`;

    try {
      const response = await _.rest.get(API_URL),
        items = response.data.items;
    
      return items.map(({ item }) => item);
    } catch (e) {
      log('error', 'Bad request getting data from search ap-media', e);
      return [];
    }
  },
  getApFeed = async () => {
    try {
      const next_page = await _.cache.get('ap-subscriptions-url');

      if (!next_page) {
        log('error', 'Could not get any value from ap-subscriptions-url');
        return null;
      }

      const endpoint = next_page.split('&').length === 1 ?
          `${next_page}&apikey=${apMediaKey}` :
          `${next_page}?apikey=${apMediaKey}`,

        response = await _.rest.get(endpoint),
        items = response.data.items;
    
      return items.map(({ item }) => item);
    } catch (e) {
      log('error', 'Bad request getting ap feed from ap-media', e);
      return [];
    }

  },
  saveApPicture = async ( pictureEndpoint ) => {
    try {
      if (!pictureEndpoint) {
        return null;
      }
      const endpoint = pictureEndpoint.split('&').length === 1 ?
          `${pictureEndpoint}&apikey=${apMediaKey}` :
          `${pictureEndpoint}?apikey=${apMediaKey}`,
        response = await _.rest.get(endpoint),
        item = response.data.item,
        url = await _.uploadImage(item.renditions.main.href),
        { pubstatus, altids, headline } = item;

      return {
        pubstatus,
        itemid: response.id,
        etag: altids.etag,
        headline,
        url
      };
    } catch (e) {
      log('error', 'Bad request saving ap picture', e);
      return {};
    }
    
  },
  getApArticleBody = async ( nitfUrl ) => {
    try {
      if (!nitfUrl) {
        log('error', 'Not niftUrl was passed');
        return null;
      }
    
      const endpoint = nitfUrl.split('&').length === 1 ?
          `${nitfUrl}&apikey=${apMediaKey}` :
          `${nitfUrl}?apikey=${apMediaKey}`,

        response = await _.rest.getHTML(endpoint),
        doc = new domUtils.DOMParser().parseFromString(response, 'text/html'),
        hedline = doc.getElementsByTagName('hedline'),
        block = doc.getElementsByTagName('block');
    
      if (hedline.length > 0 && block.length > 0) {
        return { hedline: hedline[0], block: block[0] };
      } else  {
        return {};
      }
    } catch (e) {
      log('error', 'Bad request getting article body', e);
      return {};
    }
  };

module.exports = {
  _internals: _,
  searchAp,
  getApFeed,
  saveApPicture,
  getApArticleBody
};
