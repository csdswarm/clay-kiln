'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.video = new KilnInput(schema, 'video');

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
