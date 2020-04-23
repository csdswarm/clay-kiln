'use strict';
const logger = require('../universal/logger');

const QUERY_PARAMETER = 'api-stg',

  /**
   * add cookie if the query parameter is there
   *
   * @param {object} app
   */
  inject = app => {
    app.use((req, res, next) => {
      logger(module, req, 'startAt');
      if (typeof req.query[QUERY_PARAMETER] !== 'undefined') {
        res.cookie('api_stg', 1);
        res.locals.useStagingApi = true;
      }
      logger(module, req, 'endAt');
      next();
    });
  };

module.exports.inject = inject;
