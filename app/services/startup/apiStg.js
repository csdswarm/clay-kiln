'use strict';
const QUERY_PARAMETER = 'api-stg',

  /**
   * add cookie if the query parameter is there
   *
   * @param {object} app
   */
  inject = app => {
    app.use((req, res, next) => {
      if (typeof req.query[QUERY_PARAMETER] !== 'undefined') {
        res.cookie('api_stg', 1);
        res.locals.useStagingApi = true;
      }
      next();
    });
  };

module.exports.inject = inject;
