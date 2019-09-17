'use strict';

const KilnInput = window.kiln.kilnInput,
  rest = require('../../services/universal/rest'),
  ANF_API = 'https://news-api.apple.com/';

module.exports = async schema => {
  try {
    const subscriptions = new KilnInput(schema),
      articleRef = subscriptions.getComponentInstances('article')[0],
      articleRefData = await KilnInput.getComponentData(articleRef);

    if (!!articleRefData.appleNewsEnabled) {
      schema.sectionFront = new KilnInput(schema, 'sectionFront');
      schema.secondarySectionFront = new KilnInput(schema, 'secondarySectionFront');

      subscriptions.subscribe('UPDATE_PAGE_STATE', async payload => {
        console.log(payload);

        const articleExistsinAppleNews = !!articleRefData.appleNewsID,
          articleID = articleRefData.appleNewsID,
          deleteArticle = false, // @TODO: Determine from UPDATE_PAGE_STATE payload
          metadata = {
            articleRef,
            accessoryText: articleRefData.sectionFront ||
              articleRefData.secondarySectionFront,
            isCandidateToBeFeatured,
            // ...isHiddenSchemaVal ? { isHidden: isHiddenSchemaVal } : {},
            isPreview: !!articleRefData.appleNewsPreviewOnly,
            // ...isSponsoredSchemaVal ? { isSponsored: isSponsoredSchemaVal } : {}
          }; // @TODO: ON-922 Apple News Feed Options

        rest.request(`${ ANF_API }articles${ articleExistsinAppleNews ? `/${ articleID }` : '' }`, {
          method: deleteArticle ? 'DELETE' : 'POST',
          ...deleteArticle ? {} : {
            body: JSON.stringify({
              articleRef,
              ...metadata
            })
          }
        })
          .then(({ id }) => {
            if (id) {
              articleRefData.appleNewsID = id;
            } else {
              delete articleRefData.appleNewsID;
            }
            kilnInput.publishComponent(articleRef, articleRefData);
          })
          .catch(e => console.log(`Error hitting apple news api on pub/unpub: ${ e }`));

      });
    }
  } catch(e) {
    console.log(e);
  }

  return schema;
};
