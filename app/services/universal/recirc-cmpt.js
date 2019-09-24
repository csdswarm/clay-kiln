'use strict';

const queryService = require('../../services/server/query'),
  { getComponentName } = require('clayutils'),
  _get = require('lodash/get'),
  _set = require('lodash/set'),
  _head = require('lodash/head');

/**
 * Throw an error if result is undefined
 * @param  {string} url
 * @return {function}
 */
function throwOnEmptyResult(url) {
  return function (result) {
    if (!result) {
      throw new Error('Elastic query by article url found no results for: ' + url);
    }

    return result;
  };
}

/**
 * Query for published article by URL
 *
 * NOTE: Depending on a change to the indexing strategy we may change
 * Elastic to store https urls and then the replace of `https` with `http`
 * will be unecessary.
 *
 * @param  {string} ref
 * @param  {object} data
 * @param  {object} locals
 * @param  {array} fields
 * @return {function}
 */
function getArticleData(ref, data, locals, fields) {
  var query = queryService.onePublishedArticleByUrl(data.url, fields, locals);

  return queryService.searchByQuery(query)
    .then( result => _head(result) )
    .catch(err => {
      queryService.logCatch(err, ref);
    });
}

module.exports.getArticleDataAndValidate = function (ref, data, locals, fields) {
  // if url isn't provided, clear data
  if (!data.url) {
    return Promise.resolve({});
  }

  // reset url validation unless set to 'ignore'
  if (data.urlIsValid !== 'ignore') {
    data.urlIsValid = null;
  }

  // Urls pasted from https sites need to have the url re-assigned
  // to `http` because that is what is stored in Elastic.
  data.url = data.url.replace('https', 'http');

  return getArticleData(ref, data, locals, fields)
    .then( throwOnEmptyResult(data.url) )
    .then( data => _set(data, 'urlIsValid', true) )
    .then( data => {
      data.leadComponent = null;

      const leadRef = _get(data.lead, '[0]._ref');

      if (leadRef) {
        try {
          data.leadComponent = getComponentName(leadRef);
        } catch (e) {}
      }

      return data;
    })
    .catch( err => {
      queryService.logCatch(err, ref);
      // instead of throwing error, just return the existing data
      // (this is a temporary compromise to deal with the following use case:
      // when a URL slug changes, we don't want publish to break when querying with the url)
      return data;
    });
};
