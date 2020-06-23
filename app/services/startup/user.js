'use strict';

const { userFromCookie } = require('./radium');

/**
 * adds the user object into locals if the user has the cookies set
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = (req, res, next) => {
  res.locals.radiumUser = userFromCookie(req);
  next();
};

