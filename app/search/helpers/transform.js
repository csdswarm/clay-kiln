'use strict';

const h = require('highland'),
  db = require('../../services/server/db'),
  { getPrefix } = require('clayutils'),
  { sites } = require('amphora'),
  { helpers } = require('amphora-search');

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

/**
 * Get the site from Amphora and then add the slug in.
 *
 * @param {Object} op
 * @param {String} op.key
 * @param {Object} op.value
 * @returns {Object}
 */
function addSiteToOp(op) {
  const prefix = getPrefix(op.key),
    {slug} = sites.getSiteFromPrefix(prefix);

  op.value.site = slug;
  return op;
}

/**
 * Return a pipeline that can be invoked with `.pipe`.
 *
 * Allows multiple repeatable steps to be combined into
 * one streaming pipeline. http://highlandjs.org/#pipeline
 *
 * @param  {String} index
 * @return {Function}
 */
function addSiteAndNormalize(index) {
  return function (stream) {
    return stream
      .map(addSiteToOp)
      .map(addPageUriToValue)
      .through(normalizeOp(index));
  };
}

/**
 * Add the pageUri to the op's value to get
 * it into the Elastic document
 *
 * @param {Object} op
 * @return {Object}
 */
function addPageUriToValue(op) {
  if (op.pageUri) {
    op.value.pageUri = op.pageUri;
  }

  return op;
}

module.exports.addSiteAndNormalize = addSiteAndNormalize;
