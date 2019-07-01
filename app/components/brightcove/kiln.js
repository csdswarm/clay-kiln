'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.video = new KilnInput(schema, 'video');
  schema.newVideo = new KilnInput(schema, 'newVideo');
  schema.updateVideo = new KilnInput(schema, 'updateVideo');
  schema.searchVideo = new KilnInput(schema, 'searchVideo');
  
  /* This field is set by searchVideo, newVideo or updateVideo 
  * and should not be visible in editor settings
  */
  schema.video.hide();

  subscriptions.subscribe('UPDATE_FORMDATA', input => {
    // set video if new video, search video, or update video was changed 
    console.log(schema, input);
    if (input.path === 'searchVideo' || input.path === 'newVideo' || input.path === 'updateVideo') {
      try {
        schema.video.value(input.data);
        if (input.path !== 'updateVideo') {
          // set updateVideo data and show input in frontend if video is set
          schema.updateVideo.value(input.data);
          schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
        }
        console.log("update success?", schema.video.value(), schema.updateVideo.value());
      } catch(e) {console.log(e)}
    }
  });

  subscriptions.subscribe('OPEN_FORM', formData => {
    // set updateVideo input and value if video exists
    console.log(schema, formData, schema.video.value(), schema.searchVideo.value(), schema.updateVideo.value());
    const video = schema.video.value();

    if (video) {
      schema.updateVideo.value(video);
      schema.updateVideo.setProp('_has', { input: 'brightcove-update' });
      console.log("update open form success", schema);
    }
  });

  return schema;
};
