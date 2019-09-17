'use strict';

const KilnInput = window.kiln.kilnInput,
  rest = require('../../services/universal/rest'),
  ANF_API = '/apple-news/articles';
let articleRef, articleData;

module.exports = schema => {
  try {
    const kilnInput = new KilnInput(schema);

    kilnInput.subscribe('PRELOAD_SUCCESS', payload => {
      articleRef = kilnInput.getComponentInstances('article')[0];
      articleData = payload.components[articleRef];
    });
    kilnInput.subscribe('UPDATE_PAGE_STATE', async payload => {
      console.log(payload);

      if (!!articleData.appleNewsEnabled) {
        const articleExistsinAppleNews = !!articleData.appleNewsID,
          articleID = articleData.appleNewsID,
          deleteArticle = !payload.published;

        rest.request(`${ ANF_API }${ articleExistsinAppleNews ? `/${ articleID }` : '' }`, {
          method: deleteArticle ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          ...deleteArticle ? {} : {
            body: JSON.stringify({ articleRef })
          }
        })
          .then(({ id }) => {
            if (id) {
              articleData.appleNewsID = id;
            } else {
              delete articleData.appleNewsID;
            }
            kilnInput.publishComponent(articleRef, articleData);
          })
          .catch(e => {
            console.log(`Error hitting apple news api on pub/unpub: ${ JSON.stringify(e) }`);
          });
      }
    });
  } catch(e) {
    console.log(e);
  }

  return schema;
};
