'use strict';

const _ = require('lodash'),
  h = require('highland'),
  { helpers } = require('amphora-search'),
  db = require('../../services/server/db');

/**
 * Resolves an individual component list in property
 * in a single operation
 *
 * @param  {String} prop
 * @return {Function}
 */
function resolvePropInOp(prop) {
  return function (op) {
    return Promise.all(_.map(op.value[prop], cmpt => {
      return db.get(cmpt._ref)
        .then(data => {
          data._ref = cmpt._ref;
          return data;
        })
        .catch(e => {
          throw e;
        });
    })).then(function (resp) {
      op.value[prop] = resp;
      return op;
    });
  };
}

/**
 * Given a bunch of ops, resolve all the component lists
 * in a given property (prop) for each operation
 *
 * @param  {Array} ops
 * @param  {String} prop
 * @return {Promise}
 */
function resolveComponentList(ops, prop) {
  return Promise.all(_.map(ops, resolvePropInOp(prop)));
}

/**
 * We face an issue where Amphora Search expects an array of
 * component ops, but in indexing we really only need one
 * op looked at at a time. While Amphora Search is being refactored
 * to use a stream API with helpers that accept individual ops this
 * function will be necessary.
 *
 * Invoke the function using `.through`
 * i.e. `.through(normalizeOp(index))`
 *
 * @param  {String} index
 * @return {Function}
 */
function normalizeOp(index) {
  return function (stream) {
    return stream
      .flatMap(function (op) {
        return h(helpers.normalizeOpValuesWithMapping(index, [op]));
      });
  };
}

module.exports.resolveComponentList = resolveComponentList;
module.exports.normalizeOp = normalizeOp;
