'use strict';

const log = require('../universal/log').setup({ file: __filename });

/**
 * grabs locals from the header and adds to the req.locals
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  try {
    const header = req.header('x-locals'),
      locals = header ? JSON.parse(header) : null;

    res.locals = res.locals ? {
      ...res.locals,
      ...locals
    } : locals;
  } catch (e) {
    log('error', 'Error in locals middleware:', e);
  }

  next();
};

