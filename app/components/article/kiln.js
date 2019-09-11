'use strict';

const KilnInput = window.kiln.kilnInput,
  rest = require('../../services/universal/rest'),
  ANF_API = 'https://news-api.apple.com/';

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  subscriptions.subscribe('UPDATE_PAGE_STATE', async payload => {
    // todo: hit create/update/delete apple news API on pub/unpub
    console.log('update page state payload:', JSON.stringify(payload));

    const updateArticle = false, // todo
      articleID = '', // todo
      articleRef = subscriptions.getComponentInstances('article')[0],
      updateMetadata = { // todo

      };

    rest.request(`${ ANF_API }articles${ updateArticle ? `/${ articleID }` : '' }`, {
      method: 'POST',
      body: JSON.stringify({
        articleRef,
        ...( updateArticle ? { ...updateMetadata } : {} )
      })
    })
    .then(()=>{}).catch(e => console.log(`Error hitting apple news api on pub/unpub: ${ e }`));

  });

  return schema;
};
