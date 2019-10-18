'use strict';

const filePath = './apple-news-format/preview/article.json';
let isFetching = false,
  writeArticleFile = (res) => {
    if (typeof window !== 'undefined') {
      return;
    }

    const fs = require('fs-extra');

    try {
      fs.ensureFileSync(filePath);
      fs.writeFileSync(filePath, JSON.stringify(res, null, 2));
      console.log('[ANF TEST FILE SUCCESS]');
    } catch (error) {
      console.error('[ANF TEST FILE ERROR]', error);
    }
  };

module.exports = function generateArticleFileForAppleNewsPreview(ref) {
  // to prevent an infinite fetch loop from happening, we don't do any fetching while there is a pending request
  if (isFetching) {
    return;
  }

  const fetch = require('isomorphic-fetch'),
    articleAnfDataUrl = `http://${ref}.anf?config=true`;

  isFetching = true;

  fetch(articleAnfDataUrl)
    .then(res => res.json())
    .then(writeArticleFile)
    .catch(err => {
      console.error(err);
    })
    .then(() => isFetching = false);
};
