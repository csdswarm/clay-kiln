'use strict';

/**
 * README
 *  - this interceptor allows us to return the updated loadedIds via a response
 *    header after the client requests content using pre-existing loaded ids.
 *
 *    generally speaking this gives us a means to send ajax requests from the
 *    client to get deduped content and notify the client of the updated list of
 *    loaded ids.
 *
 *  - note: in add-to-locals, 'x-loaded-ids' is used to
 *    initialize locals.loadedIds.
 */
const interceptor = require('express-interceptor'),
  loadedIdsInterceptor = interceptor((req, res) => {
    return {
      /**
       * @returns {boolean}
       */
      isInterceptable() {
        return req.get('x-loaded-ids') && res.locals.loadedIds;
      },
      /**
       * @param {*} body
       * @param {function} send
       */
      intercept(body, send) {
        res.set('x-loaded-ids', JSON.stringify(res.locals.loadedIds.sort()));
        send(body);
      }
    };
  });

module.exports = app => {
  app.use(loadedIdsInterceptor);
};
