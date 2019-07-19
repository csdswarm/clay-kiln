'use strict';
const db = require('./db'),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  { DATA_STRUCTURES } = require('./db'),
  /**
   * Middleware to ensure user is logged into CMS
   *
   * @param {Object} req
   * @param {object} res
   * @param {function} next
   *
   * @returns {Promise}
   */
  checkAuth = (req, res, next) => {
    if (!req.user || !req.user.auth) {
      return res.status(401).send('You must be logged into Kiln to add alerts');
    }

    next();
  },
  /**
   * add db access routes for each DATA_STRUCTURE to an express app
   *
   * @param {object} app
   */
  inject = app => {
    DATA_STRUCTURES.forEach(DATA_TYPE => {
      app.get(`*_${DATA_TYPE}*`, async (req, res) => {
        const key = `${CLAY_SITE_HOST}${req.originalUrl}`;

        try {
          const alert = await db.get(key);
  
          res.status(200).send(alert);
        } catch (e) {
          res.status(500).send(e.message);
        }
      });

      app.post(`*_${DATA_TYPE}*`, checkAuth, async (req, res) => {
        const key = `${CLAY_SITE_HOST}${req.originalUrl}`,
          fields = req.body;
  
        try {
          await db.post(key, fields);
          res.status(200).send(key);
        } catch (e) {
          res.status(500).send(e.message);
        }
      });
  
      app.put(`*_${DATA_TYPE}*`, checkAuth, async (req, res) => {
        const key = `${CLAY_SITE_HOST}${req.originalUrl}`,
          fields = req.body;
  
        try {
          await db.put(key, fields);
          res.status(200).send(key);
        } catch (e) {
          res.status(500).send(e.message);
        }
      });
  
      app.delete(`*_${DATA_TYPE}*`, checkAuth, async (req, res) => {
        const key = `${CLAY_SITE_HOST}${req.originalUrl}`;
  
        try {
          await db.del(key);
          res.status(200).send(key);
        } catch (e) {
          res.status(500).send(e.message);
        }
      });
    });
  };

module.exports.inject = inject;
