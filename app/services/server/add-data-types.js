'use strict';
const db = require('./db'),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  { DATA_STRUCTURES } = require('./db'),
  /**
   * build endpoints for a specific data typ
   *
   * @param {string} method
   *
   * @returns {function}
   */
  buildEndpoint = (method) => async (req, res) => {
    const key = `${CLAY_SITE_HOST}${req.originalUrl}`;

    try {
      await db[method].apply(this, [key, req.body]);
      res.status(200).send(key);
    } catch (e) {
      res.status(500).send(e.message);
    }
  },
  /**
   * add db access routes for each DATA_STRUCTURE to an express app
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    DATA_STRUCTURES.forEach(DATA_TYPE => {
      const route = `/_${DATA_TYPE}/*`;

      app.get(route, buildEndpoint('get'));

      ['post', 'put', 'delete'].forEach(method => {
        app[method](route, checkAuth, buildEndpoint(method));
      });
    });
  };

module.exports.inject = inject;
