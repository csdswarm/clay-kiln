'use strict';

const { findIndex } = require('lodash'),
  { syncFields, syncHeadlines } = require('../../services/client/kiln-utils'),
  applyContentLogic = require('../../services/kiln/apply-content-logic'),
  autoFillRecircImg = require('../../services/kiln/shared/content-components/autofill-recirc-img-to-lead-img'),
  KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const article = new KilnInput(schema);

  article.subscribe('UPDATE_COMPONENT', async ({ data, fields }) => {
    if (fields.includes('isOpinion')) {
      const tagsRef = data.tags._ref,
        tagsComponentData = await article.getComponentData(tagsRef),
        opinionTagIndex = findIndex(tagsComponentData.items, ['slug', 'opinion']),
        hasOpinionTag = opinionTagIndex >= 0;
      
      if (data.isOpinion) {
        if (!hasOpinionTag) {
          tagsComponentData.items.push({
            slug: 'opinion',
            text: 'OPINION'
          });
          await article.saveComponent(tagsRef, tagsComponentData);
        }
      } else {
        if (hasOpinionTag) {
          tagsComponentData.items.splice(opinionTagIndex, 1);
          await article.saveComponent(tagsRef, tagsComponentData);
        }
      }
    }
  }, false);

  applyContentLogic(schema);
  autoFillRecircImg(schema);

  return syncFields(schema, syncHeadlines('article'));
};
