'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  _get = require('lodash/get'),
  moment = require('moment'),
  buildQuery = ({query, endDate, startDate}) => {
    const start = startDate ? moment(startDate).startOf('day').toISOString() : '',
      end = endDate ? moment(endDate).endOf('day').toISOString() : 'NOW',
      updatedAtQuery = startDate || endDate ? `%20%2Bupdated_at:${start}..${end}` : '';

    return `${encodeURIComponent(query)}${updatedAtQuery}`;
  },
  transformSearchResults = (results) => (results || []).map(({name, images, id, updated_at}) => {
    return {name, id, imageUrl: _get(images, 'thumbnail.src', ''), updated_at};
  }),
  search = async (req, res) => {
    try {
      return brightcoveApi.request('GET', 'videos', {q: buildQuery(req.query), limit: 10})
        .then(transformSearchResults)
        .then((tResults => {
          return res.send(tResults);
        }))
        .catch(e => {
          console.error(e);
          res.send(e);
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
