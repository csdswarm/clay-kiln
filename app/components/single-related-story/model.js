'use strict';

const _assign = require('lodash/assign'),
  _pickBy = require('lodash/pickBy'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  loadedIdsService = require('../../services/server/loaded-ids'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  elasticFields = [
    'primaryHeadline',
    'pageUri'
  ];

/**
 * Merge query results into data
 * @param  {object} data - Instance data
 * @param  {object} result - Recirc query result
 * @return {object}
 */
function assignToData(data, result) {
  _assign(data, _pickBy({
    uri: result._id,
    title: data.overrideTitle || result.primaryHeadline,
    pageUri: result.pageUri,
    urlIsValid: result.urlIsValid
  }));

  if (data.title) {
    data.plaintextTitle = toPlainText(data.title);
  }

  return data;
}

module.exports.save = (uri, data, locals) => {
  const searchOpts = {
    includeIdInResult: true,
    shouldDedupeContent: false
  };

  return recircCmpt.getArticleDataAndValidate(uri, data, locals, elasticFields, searchOpts)
    .then( result => assignToData(data, result) );
};

module.exports.render = async (uri, data, locals) => {
  if (data.uri) {
    await loadedIdsService.appendToLocalsAndRedis([data.uri], locals);
  }

  return data;
};

// export for use in upgrade.js
module.exports.assignToData = assignToData;
