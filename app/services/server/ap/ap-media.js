'use strict';

const cache = require ('../cache'),
  domUtils = require('../dom-utils'),
  logger = require('../../universal/log'),
  rest = require('../../universal/rest'),
  { uploadImage } = require('../s3'),

  apMediaKey = process.env.AP_MEDIA_API_KEY,
  log = logger.setup({ file: __filename }),

  __ = {
    cache,
    log,
    rest,
    uploadImage
  },

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
  getApFeed = async () => {
    try {
      const next_page = await __.cache.get('ap-subscriptions-url');

      if (!next_page) {
        __.log('error', 'Could not get any value from ap-subscriptions-url');
        return null;
      }

      const endpoint = next_page.split('&').length === 1 ?
          `${next_page}&apikey=${apMediaKey}` :
          `${next_page}?apikey=${apMediaKey}`,

        response = await __.rest.get(endpoint),
        items = response.data.items;
    
      return items.map(({ item }) => item);
    } catch (e) {
      __.log('error', 'Bad request getting ap feed from ap-media', e);
      return [];
    }

  },
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
  };

module.exports = {
  _internals: __,
  getApArticleBody,
  getApFeed,
  saveApPicture,
  searchAp
};
