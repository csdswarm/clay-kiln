'use strict';

const amphora = require('amphora'),
  { elastic } = require('amphora-search');

/*
  Updates metadata for a page instance

  @param {String} uri
  @param {Object} newMetaData
  @returns {Promise}
*/
module.exports.updateMetaData = (uri, newMetaData) => amphora.db.getMeta(uri)
  .then(meta => ({ ...meta, ...newMetaData }))
  .then(updatedMeta => amphora.db.putMeta(uri, updatedMeta))
  .then(data => elastic.put('pages', uri, data));
