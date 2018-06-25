'use strict';

const _assign = require('lodash/assign'),
  _pickBy = require('lodash/pickBy'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  ELASTIC_FIELDS = [
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
    title: data.overrideTitle || result.primaryHeadline,
    pageUri: result.pageUri,
    urlIsValid: result.urlIsValid
  }));

  if (data.title) {
    data.plaintextTitle = toPlainText(data.title);
  }

  return data;
}

module.exports.save = (ref, data, locals) => {
  return recircCmpt.getArticleDataAndValidate(ref, data, locals, ELASTIC_FIELDS)
    .then( result => assignToData(data, result) );
};

// export for use in upgrade.js
module.exports.assignToData = assignToData;
