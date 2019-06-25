'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.autoplayUnmuted = new KilnInput(schema, 'autoplayUnmuted');
  schema.clickToPlay = new KilnInput(schema, 'clickToPlay');

  subscriptions.subscribe('OPEN_FORM', ({uri}) => {
    const bc = document.querySelector(`[data-uri="${uri}"]`);

    if (!bc.closest('.lead')) {
      schema.autoplayUnmuted.hide();
      schema.clickToPlay.hide();
    } else {
      schema.autoplayUnmuted.show();
      schema.clickToPlay.show();
    }
  });

  return schema;
};
