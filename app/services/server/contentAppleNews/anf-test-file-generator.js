'use strict';

const filePath = './apple-news-format/preview/article.json';
let isFetching = false;
/**
 * Writes the anf component tree to disk
 *
 * @param {Object} anfComponentTree
 */
const writeArticleFile = (anfComponentTree) => {
  if (typeof window !== 'undefined') {
    return;
  }

  const fs = require('fs-extra');

  try {
    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, JSON.stringify(anfComponentTree, null, 2));
  } catch (error) {
    console.error('[ANF TEST FILE ERROR]', error);
  }
};

/**
 * Writes an article.json file using the anf result from a component.
 * This is only used for development purposes.
 *
 * @param {String} clayComponentRef
 */
module.exports = function generateArticleFileForAppleNewsPreview(clayComponentRef) {
  // to prevent an infinite fetch loop from happening, we don't do any fetching while there is a pending request
  if (isFetching) {
    return;
  }

  const fetch = require('isomorphic-fetch'),
    articleAnfDataUrl = `http://${clayComponentRef}.anf?config=true`;

  isFetching = true;

  fetch(articleAnfDataUrl)
    .then(res => res.json())
    .then(writeArticleFile)
    .catch(err => {
      console.error(err);
    })
    .then(() => isFetching = false);
};
