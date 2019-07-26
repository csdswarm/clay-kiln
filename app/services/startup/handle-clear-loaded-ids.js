'use strict';

const loadedIdsService = require('../server/loaded-ids'),
  log = require('../../services/universal/log').setup({ file: __filename });

/**
 * This allows us to clear loaded ids when navigation happens at the spa level,
 *   or in the future if any other requests necessitate it.
 *
 * @param {object} _req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (_req, res, next) => {
  const { rdcSessionID } = res.locals;

  if (
    rdcSessionID
    && _req.get('x-clear-loaded-ids') === 'true'
  ) {
    try {
      await loadedIdsService.clear(rdcSessionID);
      res.locals.loadedIds = [];
    } catch (err) {
      log('error', 'Error when deleting loadedIds from redis', err);
    }
  }

  next();
};
