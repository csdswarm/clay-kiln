'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  _get = require('lodash/get'),
  transformSearchResults = (results = []) => {
    return results.map(({name, images, id}) => {
      console.log({name, id, imageUrl: _get(images, 'thumbnail.src', '')});
      return {name, id, imageUrl: _get(images, 'thumbnail.src', '')};
    });
  },
  search = async (req, res) => {
    try {
      const { query } = req.query;
 
      return brightcoveApi.request('GET', 'videos', {q: query, id: query, name: query, tags: query, limit: 10})
        .then(transformSearchResults)
        .then((tResults => {
          return res.send(tResults);
        }))
        .catch(e => {
          console.error(e);
        });
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  inject = (app) => {
    app.use('/brightcove/search', search);
  };

module.exports.inject = inject;
