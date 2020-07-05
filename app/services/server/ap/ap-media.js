'use strict';

const { uploadImage } = require('../s3'),
  rest = require('../../universal/rest'),
  redis = require ('../redis'),

  searchAp = async ( filterConditions ) => {
    const API_URL = 'https://api.ap.org/media/v/content/search',
      response = await rest.get(API_URL, {
        params: {
          apiKey: 'APIKEYHIDDEN',
          q: filterConditions,
          page_size: 100
        }
      }),
      items = response.data.data.items;
    
    return items.map(({ item }) => item);
  },
  getApFeed = async () => {
    const next_page = redis.get('ap-subscriptions-url'),
      query = 'type:text, signals:newscontent',
      response = await rest.get(next_page, {
        params: {
          q: query
        }
      }),
      items = response.data.items;
    
    return items.map(({ item }) => item);

  },
  saveApPicture = async ( pictureEndpoint ) => {
    const response = await rest.get(pictureEndpoint, {
        params: {
          apiKey: 'APIKEYHIDDEN'
        }
      }),
      item = response.data.item,
      url = await uploadImage(item.renditions.main.href), // apikey missing
      { pubStatus, altids, headline } = item;

    return { pubStatus, itemId: response.id, etag: altids.etag, headline, url };
    
  };
  // getApArticleBody = async ( NIFTUrl ) => {
  // const response = await rest.request(NIFTUrl, {
  //   params: {
  //     apiKey: 'APIKEYHIDDEN'
  //   }
  // });
  // };

module.exports = {
  searchAp,
  getApFeed,
  saveApPicture
  // getApArticleBody
};
