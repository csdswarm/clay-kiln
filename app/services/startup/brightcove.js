'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  _get = require('lodash/get'),
  moment = require('moment'),
  /**
   *  Create a query string that works with brightcove api standards
   *
   * @param {object} params includes query, endDate, and startDate
   * @returns {string} a brightcove friendly query string
   */
  buildQuery = (params) => {
    const {query, endDate, startDate} = params,
      start = startDate ? moment(startDate).startOf('day').toISOString() : '',
      end = endDate ? moment(endDate).endOf('day').toISOString() : 'NOW',
      updatedAtQuery = startDate || endDate ? `%20%2Bupdated_at:${start}..${end}` : '';

    return `${encodeURIComponent(query)}${updatedAtQuery}`;
  },
  /**
   * Return only the needed fields to the UI
   *
   * @param {Array} results array of video objects
   * @returns {Array} an array of video objects with only needed fields
   */
  transformSearchResults = (results) => (results || []).map(({name, images, id}) => {
    return {name, id, imageUrl: _get(images, 'thumbnail.src', '')};
  }),
  /**
   * Returns an array of Brightcove videos based on the provided query
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  search = async (req, res) => {
    try {
      return brightcoveApi.request('GET', 'videos', {q: buildQuery(req.query), limit: 10})
        .then(transformSearchResults)
        .then(results => {
          return res.send(results);
        })
        .catch(e => {
          console.error(e);
          res.send(e);
        });
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Add Brightcove routes to the express app
   *
   * @param {object} app the express app
   */
  inject = (app) => {
    app.use('/brightcove/search', search);
  };

module.exports.inject = inject;
