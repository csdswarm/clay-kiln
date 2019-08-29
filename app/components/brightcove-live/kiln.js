'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.video = new KilnInput(schema, 'video');
  schema.updateVideo = new KilnInput(schema, 'updateVideo');
  schema.searchVideo = new KilnInput(schema, 'searchVideo');
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

  /* This field is set by searchVideo, newVideo or updateVideo
  * and should not be visible in editor settings
  */
  schema.video.hide();

  subscriptions.subscribe('UPDATE_FORMDATA', async input => {
    // set video if new video or search video was changed
    if (['searchVideo', 'updateVideo'].includes(input.path)) {
      schema.video.value(input.data);
      try {
        if (input.path !== 'updateVideo') {
          // show newly selected video in update tab
          schema.updateVideo.value(input.data);
          schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
        }
      } catch (e) {console.log(e);}
    }
  }, true);

  subscriptions.subscribe('OPEN_FORM', () => {
    // set updateVideo input and value if video exists
    const video = schema.video.value();

    if (video) {
      schema.updateVideo.value(video);
      schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
    }
  }, true);

  return schema;
};
