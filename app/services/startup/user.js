'use strict';

const { userFromCookie } = require('./radium'),
  logger = require('../universal/logger');

/**
 * adds the user object into locals if the user has the cookies set
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = (req, res, next) => {
  logger(module, req, 'startAt');
  res.locals.radiumUser = userFromCookie(req);
  logger(module, req, 'endAt');
  next();
};

