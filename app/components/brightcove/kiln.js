'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.autoplayUnmuted = new KilnInput(schema, 'autoplayUnmuted');
  schema.clickToPlay = new KilnInput(schema, 'clickToPlay');

  schema.clickToPlay.on('change', (value) => {
    if (value) {
      schema.autoplayUnmuted.value(false);
    }
  });

  schema.autoplayUnmuted.on('change', (value) => {
    if (value) {
      schema.clickToPlay.value(false);
    }
  });

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
