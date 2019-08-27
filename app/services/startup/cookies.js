'use strict';
const _toPairs = require('lodash/toPairs'),

  /**
   * add cookie values as needed to an express app
   *
   * @param {object} app
   */
  inject = app => {
    app.use((req, res, next) => {

      addLytics(req, res);

      addClosedAlerts(req, res);

      next();
    });
  };

/**
 * add lytics to locals
 *
 * @param {ClientRequest | {cookies: object}} req
 * @param {ServerResponse | {locals: object}} res
 */
function addLytics(req, res) {
  res.locals.lytics = {
    uid: req.cookies.seerid
  };
}

/**
 * add client closed alert id list to locals
 *
 * @param {ClientRequest | {cookies: object}} req
 * @param {ServerResponse | {locals: object}} res
 */
function addClosedAlerts(req, res) {
  const re = /^atbr_/;

  res.locals.closedAlerts = _toPairs(req.cookies)
    .filter(([key]) => re.test(key))
    .map(([key])=> key.replace(re, ''));
}

module.exports.inject = inject;
