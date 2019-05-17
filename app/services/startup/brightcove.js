'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  _get = require('lodash/get'),
  buildQuery = (query) => {
    return `id:${query}%20name:${query}`;
  },
  transformSearchResults = (results = []) => {
    return results.map(({name, images, id}) => {
      return {name, id, imageUrl: _get(images, 'thumbnail.src', '')};
    });
  },
  search = async (req, res) => {
    try {
      const { query } = req.query;
 
      return brightcoveApi.request('GET', 'videos', {q: buildQuery(query), limit: 10})
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
