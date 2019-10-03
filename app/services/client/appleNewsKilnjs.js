'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils'),
  ANF_API = '/apple-news/articles';
let articleRef, articleData;

module.exports = (schema, cmptName) => {
  const kilnInput = new KilnInput(schema);

  kilnInput.subscribe('PRELOAD_SUCCESS', payload => {
    articleRef = kilnInput.getComponentInstances(cmptName)[0];
    articleData = payload.components[articleRef];
  });
  kilnInput.subscribe('UPDATE_COMPONENT', payload => {
    if (['article', 'gallery'].includes(getComponentName(payload.uri))) {
      articleData = payload.data;
    }
  });
  kilnInput.subscribe('UPDATE_PAGE_STATE', async payload => {
    if (!!articleData.appleNewsEnabled &&
      ['publish', 'unpublish'].includes(payload.history[payload.history.length - 1].action)) {
      const articleExistsinAppleNews = !!articleData.appleNewsID,
        articleID = articleData.appleNewsID,
        deleteArticle = !payload.published;

      if ( deleteArticle && articleExistsinAppleNews ||
        !deleteArticle ) {
        kilnInput.fetch(
          `${ ANF_API }${ articleExistsinAppleNews ? `/${ articleID }` : '' }`,
          {
            method: deleteArticle ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            ...deleteArticle ? {} : {
              body: JSON.stringify({
                articleRef,
                revision: articleData.appleNewsRevision
              })
            }
          },
          false,
          120000
        )
          .then(response => {
            const contentType = response.headers.get('Content-Type');

            if (contentType && contentType.includes('application/json')) {
              return response.json();
            } else {
              return response.text();
            }
          })
          .then(jsonOrText => {
            if (typeof jsonOrText === 'string') {
              delete articleData.appleNewsID;
              delete articleData.appleNewsRevision;
            } else {
              const { id, revision } = jsonOrText;

              if (id) {
                articleData.appleNewsID = id;
                articleData.appleNewsRevision = revision;
              }
            }

            kilnInput.saveComponent(articleRef, articleData);
          })
          .catch(error => {
            if (error.message === 'Timeout') {
              console.log('Timeout hitting apple news api on pub/unpub');
            } else {
              console.log(`Error hitting apple news api on pub/unpub: ${ error.message }`);
              if (error.message === '404: Not Found') {
                delete articleData.appleNewsID;
                delete articleData.appleNewsRevision;
                kilnInput.saveComponent(articleRef, articleData);
              }
            }
          });
      }
    }
  });

  return schema;
};
