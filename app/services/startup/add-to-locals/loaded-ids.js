'use strict';

/**
 * adds 'loadedIds' onto locals which can optionally be initialized via a
 *   request header.
 *
 * loadedIds is an array of content ids which have been loaded to the page and
 *   is used to ensure duplicate content is avoided when possible.  There are
 *   still instances where curated content showing up later on the page may have
 *   shown up earlier in the page, but resolving that would be a lot of work as
 *   far as we're aware.
 *
 * @param {object} app - the express app
 */
module.exports = app => {
  app.use((req, res, next) => {
    const loadedIdsStr = req.get('x-loaded-ids') || '[]';

    res.locals.loadedIds = JSON.parse(loadedIdsStr);

    next();
  });
};
