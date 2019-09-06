'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.video = new KilnInput(schema, 'video');
  schema.autoplayUnmuted = new KilnInput(schema, 'autoplayUnmuted');
  schema.clickToPlay = new KilnInput(schema, 'clickToPlay');

  schema.clickToPlay.on('change', (value) => {
    if (value) {
      schema.autoplayUnmuted.value(false);
    }
  });

  schema.autoplayUnmuted.on('change', (value) => {
    if (value) {
      schema.autoplayUnmuted.showSnackBar({message: 'Some browsers may disable autoplayed videos if unmuted'});
      schema.clickToPlay.value(false);
    }
  });

  /* This field is set by searchVideo
  * and should not be visible in editor settings
  */
  schema.video.hide();

  subscriptions.subscribe('UPDATE_FORMDATA', async input => {
    // set video if search video was changed
    if (['searchVideo'].includes(input.path)) {
      schema.video.value(input.data);
    }
  }, true);

  return schema;
};
