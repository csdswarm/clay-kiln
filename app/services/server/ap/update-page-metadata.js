'use strict';

const axios = require('axios');

const {
  CLAY_ACCESS_KEY: accessKey,
  CLAY_SITE_PROTOCOL: protocol
} = process.env;

/**
 * updates the page's meta data components
 *
 * note: meta-url and meta-tags do not need to be updated since the default
 *   values suffice
 *
 * @param {object} updatedArticleData
 * @returns {Promise<object[]>}
 */
function updatePageMetaData({ metaDescription, metaImage, metaTitle }) {
  return Promise.all([
    update(metaDescription),
    update(metaImage),
    update(metaTitle)
  ]);
}

/**
 * updates the meta data
 *
 * @param {object} metaData
 * @returns {Promise<object>}
 */
function update(metaData) {
  const { _ref, ...data } = metaData;

  return axios.put(`${protocol}://${_ref}`, data, {
    headers: { Authorization: `token ${accessKey}` }
  });
}

module.exports = updatePageMetaData;
